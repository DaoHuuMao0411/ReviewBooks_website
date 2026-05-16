(function () {
  function getCookie(name) {
    const parts = document.cookie.split(';').map(function (item) { return item.trim(); });
    const found = parts.find(function (item) { return item.indexOf(name + '=') === 0; });
    return found ? decodeURIComponent(found.split('=').slice(1).join('=')) : '';
  }

  function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/; SameSite=Lax';
  }

  document.addEventListener('DOMContentLoaded', function () {
    const popup = document.querySelector('[data-popup]');
    const closeButton = document.querySelector('[data-popup-close]');

    if (!popup || getCookie('book_popup_closed') === 'true') return;

    const delay = 60000;
    window.setTimeout(function () {
      popup.hidden = false;
    }, delay);

    if (closeButton) {
      closeButton.addEventListener('click', function () {
        popup.hidden = true;
        setCookie('book_popup_closed', 'true', 30);
      });
    }
  });
})();
