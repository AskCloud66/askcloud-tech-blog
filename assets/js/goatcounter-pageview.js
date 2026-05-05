import * as params from '@params';

const code = params.code;

function normalizePath(pathname) {
  if (!pathname) return '/';
  return pathname.endsWith('/') ? pathname : `${pathname}/`;
}

async function updatePageviews() {
  const targets = document.querySelectorAll('.goatcounter-pageview-count[data-path]');
  if (!targets.length || !code) return;

  const path = normalizePath(targets[0].dataset.path || window.location.pathname);
  const query = new URLSearchParams({
    path_by_name: 'true',
    include_paths: path,
  });

  try {
    const response = await fetch(`https://${code}.goatcounter.com/api/v0/stats/total?${query.toString()}`, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`GoatCounter stats request failed: ${response.status}`);
    }

    const data = await response.json();
    const count = Number(data.count || 0);
    targets.forEach((target) => {
      target.textContent = String(count);
    });
  } catch (error) {
    console.error(error);
    targets.forEach((target) => {
      target.textContent = '0';
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  void updatePageviews();
});
