document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('[data-validate-form]').forEach(function (form) {
    form.addEventListener('submit', function (event) {
      const invalid = Array.from(form.elements).find(function (element) {
        return element.willValidate && !element.checkValidity();
      });

      if (invalid) {
        event.preventDefault();
        invalid.focus();
        const label = invalid.closest('label');
        const labelText = label ? label.childNodes[0].textContent.trim() : 'Trường dữ liệu';
        alert(labelText + ': ' + (invalid.validationMessage || 'Vui lòng kiểm tra lại dữ liệu.'));
      }
    });
  });
});
