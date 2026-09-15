const statusElement = document.getElementById('status');
const recipeListElement = document.getElementById('recipe-list');
const searchInput = document.getElementById('search-input');

// Apps ScriptのウェブアプリURLをここに入れる
const API_URL = 'https://script.google.com/macros/s/AKfycbxHD8qW8Docm6L0kNcatDp73bNR7TiKisFjybBHdqkgFVSfYVQ4ANjQ3xC0KGGMaORW9w/exec';

let recipes = [];
let selectedKana = 'all';

function renderRecipes(recipeData) {
  recipeListElement.innerHTML = '';

  recipeData.forEach(recipe => {
    const item = document.createElement('article');

    item.innerHTML = `
      <h2>${recipe.name} / ${recipe.kana}</h2>
    `;

    item.addEventListener('click', () => {
      // いったん全部の選択状態を解除
      document
        .querySelectorAll('#recipe-list article')
        .forEach(el => el.classList.remove('selected'));

      // クリックしたものを選択状態にする
      item.classList.add('selected');

      showRecipeDetail(recipe);
    });

    recipeListElement.appendChild(item);
  });

  statusElement.textContent = `${recipeData.length}件`;
}

function showRecipeDetail(recipe) {
  const detailElement = document.getElementById('recipe-detail');

  const imageUrl = recipe.imageUrl
    ? recipe.imageUrl.replace(/^\[.*?\]\((https?:\/\/.*?)\)$/, '$1')
    : '';

  detailElement.innerHTML = `
  <button id="back-to-list" class="back-button">
    ← カクテル一覧
  </button>

  <h1>${recipe.name}</h1>
  <h2>（${recipe.kana}）</h2>

  <div class="detail-meta">
    <span><strong>技法:</strong> ${recipe.technique}</span>
    <span><strong>グラス:</strong> ${recipe.glass}</span>
  </div>

  <div class="detail-content">

    <div class="detail-text">

      <h3>材料と分量</h3>

      <ul class="detail-ingredients">
        ${recipe.ingredients.map(item => `
          <li>
            <strong>${item.name}:</strong> ${item.amount}
          </li>
        `).join('')}
      </ul>

      <h3>備考</h3>

      <p>
        ${recipe.note || '特になし'}
      </p>

    </div>

    ${imageUrl ? `
      <div class="detail-image-area">
        <img
  src="${imageUrl}"
  alt="${recipe.name}"
  class="detail-image"
  id="detail-image"
>
      </div>
    ` : ''}

  </div>
`;
document.body.classList.add('show-detail');

document
  .getElementById('back-to-list')
  .addEventListener('click', () => {
    document.body.classList.remove('show-detail');
  });

  const detailImage = document.getElementById('detail-image');

if (detailImage) {
  detailImage.addEventListener('click', () => {
    const overlay = document.createElement('div');
    overlay.className = 'image-overlay';

    overlay.innerHTML = `
      <img src="${imageUrl}" alt="${recipe.name}">
    `;

    overlay.addEventListener('click', () => {
      overlay.remove();
    });

    document.body.appendChild(overlay);
  });
}
}

async function loadRecipes() {
  statusElement.textContent = 'レシピを読み込み中...';

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`HTTPエラー: ${response.status}`);
    }

    const data = await response.json();

    recipes = data.recipes;

    // 取得したレシピを端末に保存
    localStorage.setItem(
      'cocktailRecipes',
      JSON.stringify(recipes)
    );

    renderRecipes(recipes);
    
    // PCでは最初のレシピを自動表示
if (window.innerWidth > 700 && recipes.length > 0) {
  const firstItem = document.querySelector('#recipe-list article');

  if (firstItem) {
    firstItem.classList.add('selected');
  }

  showRecipeDetail(recipes[0]);

  // PCでは詳細表示用のbodyクラスは不要
  document.body.classList.remove('show-detail');
}

  } catch (error) {
    console.error(error);

    // 通信できなければ保存済みデータを使用
    const cachedRecipes = localStorage.getItem('cocktailRecipes');

    if (cachedRecipes) {
      recipes = JSON.parse(cachedRecipes);
      renderRecipes(recipes);

      statusElement.textContent =
        `${recipes.length}件のレシピを表示中（保存データ）`;
    } else {
      statusElement.textContent =
        'レシピの読み込みに失敗しました';
    }
  }
}

searchInput.addEventListener('input', applyFilters);

document.getElementById('search-button').addEventListener('click', applyFilters);

document.querySelectorAll('.kana-filter button').forEach(button => {
  button.addEventListener('click', () => {

    document
      .querySelectorAll('.kana-filter button')
      .forEach(btn => btn.classList.remove('active'));

    button.classList.add('active');

    selectedKana = button.dataset.kana;

    applyFilters();
  });
});

loadRecipes();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./service-worker.js')
      .then(() => {
        console.log('Service Worker registered');
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

function getKanaGroup(kana) {
  if (!kana) return '';

  const first = kana.trim().charAt(0);

  const groups = {
    'ア': 'アイウエオァィゥェォヴ',
    'カ': 'カキクケコガギグゲゴ',
    'サ': 'サシスセソザジズゼゾ',
    'タ': 'タチツテトダヂヅデド',
    'ナ': 'ナニヌネノ',
    'ハ': 'ハヒフヘホバビブベボパピプペポ',
    'マ': 'マミムメモ',
    'ヤ': 'ヤユヨャュョ',
    'ラ': 'ラリルレロ',
    'ワ': 'ワヲン'
  };

  for (const [group, characters] of Object.entries(groups)) {
    if (characters.includes(first)) {
      return group;
    }
  }

  return '';
}

function applyFilters() {
  const keyword = searchInput.value.trim().toLowerCase();

  const filteredRecipes = recipes.filter(recipe => {

    // 名前・カナ・材料を検索対象にする
    const ingredientText = recipe.ingredients
      .map(item => item.name)
      .join(' ')
      .toLowerCase();

    const matchesSearch =
      recipe.name.toLowerCase().includes(keyword) ||
      recipe.kana.includes(keyword) ||
      ingredientText.includes(keyword);

    // 五十音フィルター
    const matchesKana =
      selectedKana === 'all' ||
      getKanaGroup(recipe.kana) === selectedKana;

    return matchesSearch && matchesKana;
  });

  // 五十音で絞り込んでいる時だけ、カナの五十音順に並べ替える
if (selectedKana !== 'all') {
  const collator = new Intl.Collator('ja', {
    usage: 'sort',
    sensitivity: 'base'
  });

  filteredRecipes.sort((a, b) => {
    return collator.compare(a.kana, b.kana);
  });
}

  renderRecipes(filteredRecipes);
}