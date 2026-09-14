const statusElement = document.getElementById('status');
const recipeListElement = document.getElementById('recipe-list');
const searchInput = document.getElementById('search-input');

// Apps ScriptのウェブアプリURLをここに入れる
const API_URL = 'https://script.google.com/macros/s/AKfycbxHD8qW8Docm6L0kNcatDp73bNR7TiKisFjybBHdqkgFVSfYVQ4ANjQ3xC0KGGMaORW9w/exec';

let recipes = [];

function renderRecipes(recipeData) {
  recipeListElement.innerHTML = '';

  recipeData.forEach(recipe => {
    const card = document.createElement('article');

    const imageUrl = recipe.imageUrl
  ? recipe.imageUrl.replace(/^\[.*?\]\((https?:\/\/.*?)\)$/, '$1')
  : '';

card.innerHTML = `
  ${imageUrl ? `
    <img
      src="${imageUrl}"
      alt="${recipe.name}"
      class="recipe-image"
      loading="lazy"
    >
  ` : ''}

  <h2>${recipe.name}</h2>
  <p>${recipe.kana}</p>
  <p>${recipe.technique} / ${recipe.glass}</p>

  <ul>
    ${recipe.ingredients.map(item => `
      <li>${item.name}：${item.amount}</li>
    `).join('')}
  </ul>
  
  ${recipe.note ? `
  <p class="recipe-note">${recipe.note}</p>
` : ''}
`;

    recipeListElement.appendChild(card);
  });

  statusElement.textContent = `${recipeData.length}件のレシピを表示中`;
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

    renderRecipes(recipes);

  } catch (error) {
    console.error(error);
    statusElement.textContent = 'レシピの読み込みに失敗しました';
  }
}

searchInput.addEventListener('input', () => {
  const keyword = searchInput.value.trim().toLowerCase();

  const filteredRecipes = recipes.filter(recipe => {
    return (
      recipe.name.toLowerCase().includes(keyword) ||
      recipe.kana.includes(keyword)
    );
  });

  renderRecipes(filteredRecipes);
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