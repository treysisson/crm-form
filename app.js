document.getElementById('searchBtn').addEventListener('click', async () => {
  const query = document.getElementById('searchInput').value.trim();
  const status = document.getElementById('statusMessage');
  const formContainer = document.getElementById('formContainer');

  if (!query) return;

  status.textContent = '🔍 Searching...';
  formContainer.innerHTML = '';
  formContainer.classList.add('hidden');

  try {
    const response = await fetch('https://primary-production-13b5.up.railway.app/webhook/search_user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    const result = await response.json();
    const { userExists, fields } = result;

    status.textContent = userExists ? '🟢 Existing user found' : '🔵 New user - fill out form';
    formContainer.classList.remove('hidden');

    const form = document.createElement('form');
    form.id = 'crmForm';

    fields.forEach(field => {
      const wrapper = document.createElement('div');
      wrapper.className = 'mb-4';

      const label = document.createElement('label');
      label.className = 'block text-sm font-medium text-gray-700 mb-1';
      label.textContent = field.label;

      let input;

      if (field.type === 'text') {
        input = document.createElement('input');
        input.type = 'text';
        input.value = field.value || field.default || '';
        input.className = 'w-full border border-gray-300 rounded px-3 py-2';
      } else if (field.type === 'radio' || field.type === 'dropdown') {
        input = document.createElement('select');
        input.className = 'w-full border border-gray-300 rounded px-3 py-2';
        (field.options || []).forEach(option => {
          const opt = document.createElement('option');
          opt.value = option;
          opt.textContent = option;
          if (option === field.value || (!field.value && option === field.default)) {
            opt.selected = true;
          }
          input.appendChild(opt);
        });
      }

      input.name = field.key;
      wrapper.appendChild(label);
      wrapper.appendChild(input);
      form.appendChild(wrapper);
    });

    const submitBtn = document.createElement('button');
    submitBtn.textContent = 'Submit';
    submitBtn.type = 'submit';
    submitBtn.className = 'mt-4 bg-[var(--color-secondary)] text-black px-4 py-2 rounded';

    form.appendChild(submitBtn);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      data.query = query;

      const updateRes = await fetch('https://primary-production-13b5.up.railway.app/webhook/update_user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const updateResult = await updateRes.json();
      status.textContent = updateResult.success ? '✅ Successfully updated' : '⚠️ Update failed';
    });

    formContainer.appendChild(form);
  } catch (err) {
    console.error('Error during search:', err);
    status.textContent = '❌ Error searching user.';
  }
});