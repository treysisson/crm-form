// Utility functions
function sanitizeText(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text.toString();
    return div.innerHTML;
}

function validateApiResponse(result) {
    if (!result || typeof result !== 'object') {
        throw new Error('Invalid API response format');
    }
    if (!Array.isArray(result.fields)) {
        throw new Error('Invalid fields data from API');
    }
    return true;
}

async function makeApiRequest(url, data) {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
}

function createFormField(field) {
    if (!field.key || !field.label || !field.type) {
        console.warn('Invalid field structure:', field);
        return null;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'mb-4';

    const label = document.createElement('label');
    label.className = 'block text-sm font-medium text-gray-700 mb-1';
    label.textContent = sanitizeText(field.label);

    let input;

    if (field.type === 'text') {
        input = document.createElement('input');
        input.type = 'text';
        input.value = sanitizeText(field.value || field.default || '');
        input.className = 'w-full border border-gray-300 rounded px-3 py-2';
    } else if (field.type === 'radio' || field.type === 'dropdown') {
        input = document.createElement('select');
        input.className = 'w-full border border-gray-300 rounded px-3 py-2';
        
        if (Array.isArray(field.options)) {
            field.options.forEach(option => {
                const opt = document.createElement('option');
                opt.value = sanitizeText(option);
                opt.textContent = sanitizeText(option);
                if (option === field.value || (!field.value && option === field.default)) {
                    opt.selected = true;
                }
                input.appendChild(opt);
            });
        }
    }

    if (input) {
        input.name = field.key;
        wrapper.appendChild(label);
        wrapper.appendChild(input);
        return wrapper;
    }
    
    return null;
}

function setStatus(message, type = 'info') {
    const status = document.getElementById('statusMessage');
    status.textContent = message;
    status.className = `mt-4 text-sm ${type === 'error' ? 'text-red-600' : 'text-gray-600'}`;
}

function toggleButton(button, loading = false) {
    button.disabled = loading;
    button.innerHTML = loading ? '🔍 Searching...' : 'Search';
}

// Main search functionality
document.getElementById('searchBtn').addEventListener('click', async () => {
    const query = document.getElementById('searchInput').value.trim();
    const status = document.getElementById('statusMessage');
    const formContainer = document.getElementById('formContainer');
    const searchBtn = document.getElementById('searchBtn');

    if (!query) {
        setStatus('Please enter a search query', 'error');
        return;
    }

    toggleButton(searchBtn, true);
    setStatus('🔍 Searching...');
    formContainer.innerHTML = '';
    formContainer.classList.add('hidden');

    try {
        const result = await makeApiRequest(
            'https://primary-production-13b5.up.railway.app/webhook-test/search_user',
            { query }
        );
        
        validateApiResponse(result);
        const { userExists, fields } = result;

        setStatus(userExists ? '🟢 Existing user found' : '🔵 New user - fill out form');
        formContainer.classList.remove('hidden');

        const form = document.createElement('form');
        form.id = 'crmForm';

        // Create form fields
        fields.forEach(field => {
            const fieldElement = createFormField(field);
            if (fieldElement) {
                form.appendChild(fieldElement);
            }
        });

        // Submit button
        const submitBtn = document.createElement('button');
        submitBtn.textContent = 'Submit';
        submitBtn.type = 'submit';
        submitBtn.className = 'mt-4 bg-[var(--color-secondary)] text-black px-4 py-2 rounded hover:opacity-90 disabled:opacity-50';

        form.appendChild(submitBtn);

        // Form submission handler
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            submitBtn.disabled = true;
            submitBtn.textContent = 'Updating...';

            try {
                const formData = Object.fromEntries(new FormData(form));
                formData.query = query;

                const updateResult = await makeApiRequest(
                    'https://primary-production-13b5.up.railway.app/webhook-test/update_user',
                    formData
                );

                setStatus(updateResult.success ? '✅ Successfully updated' : '⚠️ Update failed');
            } catch (error) {
                console.error('Error during update:', error);
                setStatus('❌ Error updating user', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit';
            }
        });

        formContainer.appendChild(form);

    } catch (error) {
        console.error('Error during search:', error);
        setStatus('❌ Error searching user', 'error');
    } finally {
        toggleButton(searchBtn, false);
    }
});

// Enter key support
document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('searchBtn').click();
    }
});
