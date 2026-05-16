document.addEventListener('DOMContentLoaded', function () {
  const confirmedForms = document.querySelectorAll('form[data-confirm]');

  confirmedForms.forEach(function (form) {
    form.addEventListener('submit', function (event) {
      const message = form.getAttribute('data-confirm') || 'Bạn chắc chắn muốn thực hiện thao tác này?';
      if (!window.confirm(message)) {
        event.preventDefault();
      }
    });
  });
});
