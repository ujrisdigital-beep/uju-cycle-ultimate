import React, { useState } from 'react';

const recipes = [
  {
    name: 'Domoda',
    type: 'National Dish',
    description: 'Rich peanut butter stew slow-cooked with meat, sweet potatoes, carrots, and cabbage. The ultimate comfort food of The Gambia.',
    ingredients: ['1 cup peanut butter (unsweetened)', '500g beef or lamb, cubed', '2 large sweet potatoes, peeled and cubed', '2 carrots, sliced', '1/2 cabbage, chopped', '2 onions, chopped', '3 tomatoes, blended', '2 tbsp tomato paste', '1 scotch bonnet pepper (optional)', 'Salt and pepper to taste', '2 cups water or stock'],
    instructions: [
      'Brown meat in a large pot with a little oil.',
      'Add onions and cook until soft.',
      'Stir in tomato paste and blended tomatoes. Cook for 5 minutes.',
      'Add water/stock and bring to a boil.',
      'Add sweet potatoes, carrots, and cabbage.',
      'Simmer for 20 minutes until vegetables are tender.',
      'Stir in peanut butter until fully incorporated.',
      'Simmer for another 10-15 minutes until stew thickens.',
      'Season with salt, pepper, and scotch bonnet if using.',
      'Serve hot with rice or tapalapa bread.'
    ],
    prepTime: '20 mins',
    cookTime: '45 mins',
    servings: '4-6'
  },
  {
    name: 'Benachin (Gambian Jollof)',
    type: 'Classic Rice Dish',
    description: 'The Gambian version of Jollof rice, cooked with fish, vegetables, and aromatic spices. A party favorite!',
    ingredients: ['2 cups rice (long grain)', '500g fish (tilapia or croaker)', '3 tbsp vegetable oil', '2 onions, sliced', '3 tomatoes, blended', '2 tbsp tomato paste', '1 cup mixed vegetables (carrots, peas, green beans)', '1 scotch bonnet pepper', '1 tsp thyme', '1 tsp curry powder', 'Salt and pepper to taste', '3 cups water or fish stock'],
    instructions: [
      'Season fish with salt, pepper, and lemon juice. Fry lightly and set aside.',
      'Heat oil in a pot. Add onions and sauté until golden.',
      'Add blended tomatoes and tomato paste. Cook for 10 minutes.',
      'Add thyme, curry, salt, pepper, and scotch bonnet.',
      'Pour in water/stock and bring to a boil.',
      'Add rice and stir well. Reduce heat to low.',
      'Cover and simmer for 15 minutes.',
      'Add mixed vegetables and flaked fish on top.',
      'Cover and cook for another 10 minutes until rice is tender.',
      'Fluff with fork and serve hot.'
    ],
    prepTime: '25 mins',
    cookTime: '35 mins',
    servings: '4-6'
  },
  {
    name: 'Yassa',
    type: 'Chicken or Fish',
    description: 'Tangy and flavorful dish where meat or fish is marinated in lemon, onions, and mustard, then grilled and simmered in the marinade.',
    ingredients: ['1 whole chicken (or 500g fish), cut into pieces', '4 lemons (juice)', '4 large onions, sliced', '3 tbsp Dijon mustard', '5 cloves garlic, minced', '1 tsp thyme', '4 tbsp vegetable oil', '2 bay leaves', 'Salt and pepper to taste', '1 cup water', 'Rice for serving'],
    instructions: [
      'Mix lemon juice, mustard, garlic, thyme, oil, salt, and pepper for marinade.',
      'Coat chicken/fish thoroughly. Marinate for at least 2 hours (overnight best).',
      'Remove meat from marinade, reserving marinade.',
      'Grill or fry meat until golden brown. Set aside.',
      'In same pan, cook onions until soft and caramelized.',
      'Add reserved marinade and water. Simmer for 10 minutes.',
      'Return meat to pan, cover, and cook for 20 minutes.',
      'Adjust seasoning. Sauce should be tangy and rich.',
      'Serve over rice with extra onion sauce.'
    ],
    prepTime: '20 mins + marinating',
    cookTime: '40 mins',
    servings: '4-6'
  },
  {
    name: 'Superkanja',
    type: 'Okra Stew',
    description: 'Hearty okra-based stew with fish or meat, palm oil, and spices. Thick, nutritious, and deeply satisfying.',
    ingredients: ['500g okra, finely chopped or blended', '500g fish or meat', '3 tbsp palm oil', '2 onions, chopped', '2 tomatoes, blended', '1 tsp ground crayfish (optional)', '1 scotch bonnet pepper', 'Salt and maggi cubes to taste', '2 cups water', '2 tbsp peanut butter (optional, for thickening)'],
    instructions: [
      'Cook meat/fish in water with salt and maggi until tender. Set aside.',
      'Heat palm oil in a pot. Add onions and sauté.',
      'Add blended tomatoes and cook for 5 minutes.',
      'Add chopped okra and cook, stirring frequently (okra becomes slimy).',
      'Add water, scotch bonnet, crayfish, salt, and maggi.',
      'Simmer for 15-20 minutes until okra is soft and stew thickens.',
      'Stir in peanut butter if using for extra richness.',
      'Add cooked meat/fish and simmer for 5 more minutes.',
      'Serve hot with rice, benachin, or tapalapa.'
    ],
    prepTime: '20 mins',
    cookTime: '30 mins',
    servings: '4-6'
  }
];

const GambianFoodRecipes = () => {
  const [expandedRecipe, setExpandedRecipe] = useState(null);
  const [showPrint, setShowPrint] = useState(false);

  const toggleRecipe = (idx) => {
    setExpandedRecipe(expandedRecipe === idx ? null : idx);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🍲 Gambian Food Recipes</h2>
      <p style={styles.subtitle}>Traditional dishes from The Smiling Coast of Africa</p>
      
      <div style={styles.recipeGrid}>
        {recipes.map((recipe, idx) => (
          <div key={idx} style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.recipeName}>{recipe.name}</h3>
              <span style={styles.badge}>{recipe.type}</span>
            </div>
            <p style={styles.description}>{recipe.description}</p>
            
            <div style={styles.meta}>
              <span>⏱️ Prep: {recipe.prepTime}</span>
              <span>🍳 Cook: {recipe.cookTime}</span>
              <span>🍽️ Serves: {recipe.servings}</span>
            </div>

            <button 
              onClick={() => toggleRecipe(idx)}
              style={styles.toggleButton}
            >
              {expandedRecipe === idx ? 'Hide Recipe' : 'View Full Recipe'}
            </button>

            {expandedRecipe === idx && (
              <div style={styles.recipeDetail}>
                <div style={styles.section}>
                  <h4 style={styles.sectionTitle}>📝 Ingredients</h4>
                  <ul style={styles.ingredientList}>
                    {recipe.ingredients.map((ing, i) => (
                      <li key={i} style={styles.ingredient}>{ing}</li>
                    ))}
                  </ul>
                </div>
                
                <div style={styles.section}>
                  <h4 style={styles.sectionTitle}>👨‍🍳 Instructions</h4>
                  <ol style={styles.instructionList}>
                    {recipe.instructions.map((step, i) => (
                      <li key={i} style={styles.instruction}>{step}</li>
                    ))}
                  </ol>
                </div>

                <button 
                  onClick={() => window.print()}
                  style={styles.printButton}
                >
                  🖨️ Print Recipe Card
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    color: '#EEF2F7'
  },
  title: {
    color: '#C9A84C',
    fontSize: '2rem',
    marginBottom: '5px'
  },
  subtitle: {
    color: '#0C7B7A',
    fontSize: '1rem',
    marginBottom: '30px'
  },
  recipeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '25px'
  },
  card: {
    backgroundColor: '#0D1B2A',
    padding: '25px',
    borderRadius: '12px',
    border: '1px solid #7A8FA6',
    transition: 'transform 0.2s, box-shadow 0.2s'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  },
  recipeName: {
    color: '#C9A84C',
    fontSize: '1.5rem',
    margin: 0
  },
  badge: {
    padding: '4px 12px',
    backgroundColor: '#0C7B7A',
    color: '#EEF2F7',
    borderRadius: '12px',
    fontSize: '0.8rem'
  },
  description: {
    color: '#EEF2F7',
    lineHeight: '1.5',
    marginBottom: '15px'
  },
  meta: {
    display: 'flex',
    gap: '15px',
    flexWrap: 'wrap',
    marginBottom: '15px',
    fontSize: '0.9rem',
    color: '#7A8FA6'
  },
  toggleButton: {
    padding: '10px 20px',
    backgroundColor: '#0C7B7A',
    color: '#EEF2F7',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    width: '100%'
  },
  recipeDetail: {
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid #12243A'
  },
  section: {
    marginBottom: '20px'
  },
  sectionTitle: {
    color: '#C9A84C',
    fontSize: '1.1rem',
    marginBottom: '10px'
  },
  ingredientList: {
    paddingLeft: '20px',
    color: '#EEF2F7'
  },
  ingredient: {
    marginBottom: '5px',
    lineHeight: '1.4'
  },
  instructionList: {
    paddingLeft: '20px',
    color: '#EEF2F7'
  },
  instruction: {
    marginBottom: '10px',
    lineHeight: '1.5'
  },
  printButton: {
    padding: '10px 20px',
    backgroundColor: '#C9A84C',
    color: '#0D1B2A',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginTop: '15px'
  }
};

export default GambianFoodRecipes;
