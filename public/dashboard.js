const token = localStorage.getItem('token');
if (!token) {
  window.location.href = 'index.html';
}

const nameInput = document.getElementById('name');
const ageInput = document.getElementById('age');
const genderSelect = document.getElementById('gender');
const joiningDateInput = document.getElementById('joining_date');
const departmentSelect = document.getElementById('department');
const punchInInput = document.getElementById('punch_in');
const addBtn = document.getElementById('addEmployee');
const tableBody = document.getElementById('employeeTable');

async function loadEmployees() {
  const res = await fetch('/api/employees', { headers: { 'x-auth-token': token } });
  const employees = await res.json();
  tableBody.innerHTML = '';
  
  employees.forEach(emp => {
    const isLate = new Date(`1970-01-01T${emp.punch_in}`) > new Date(`1970-01-01T10:00:00`);
    const lateDays = emp.late_days || 0;
    const deduction = lateDays * 200;
    const finalSalary = 50000 - deduction;

    const row = document.createElement('tr');
    if (isLate) row.style.color = 'red';

    row.innerHTML = `
      <td>${emp.id}</td>
      <td>${emp.name}</td>
      <td>${emp.age || '-'}</td>
      <td>${emp.gender}</td>
      <td>${emp.department}</td>
      <td>${emp.joining_date}</td>
      <td>${emp.punch_in}</td>
      <td>${lateDays}</td>
      <td>₹${finalSalary}</td>
      <td><button class="delete-btn" data-id="${emp.id}">Delete</button></td>
    `;
    tableBody.appendChild(row);
  });

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.dataset.id;
      await fetch(`/api/employees/${id}`, {
        method: 'DELETE',
        headers: { 'x-auth-token': token }
      });
      loadEmployees();
    });
  });
}

addBtn.addEventListener('click', async () => {
  const name = nameInput.value.trim();
  const age = ageInput.value;
  const gender = genderSelect.value;
  const joining_date = joiningDateInput.value;
  const department = departmentSelect.value;
  const punch_in = punchInInput.value;

  if (!name || !joining_date || !department || !gender || !punch_in) {
    alert('Please fill all fields');
    return;
  }

  const res = await fetch('/api/employees', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-auth-token': token
    },
    body: JSON.stringify({ name, age, gender, department, joining_date, punch_in })
  });

  if (res.ok) {
    nameInput.value = '';
    ageInput.value = '';
    joiningDateInput.value = '';
    punchInInput.value = '';
    loadEmployees();
  } else {
    const data = await res.json();
    alert(data.error || 'Failed to add employee');
  }
});

loadEmployees();
