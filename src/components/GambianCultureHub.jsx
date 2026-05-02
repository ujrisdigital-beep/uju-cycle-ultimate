import React, { useState } from 'react';

// Cultural Data
const ethnicGroups = [
  { name: 'Mandinka', percentage: '34-42%', description: 'Largest group, Mali Empire heritage, griot traditions, agriculture', color: '#C9A84C' },
  { name: 'Fula', percentage: '22-25%', description: 'Pastoralists, cattle herding, graceful culture', color: '#0C7B7A' },
  { name: 'Wolof', percentage: '12-16%', description: 'Urban traders, influential music/fashion', color: '#E74C3C' },
  { name: 'Jola', percentage: '9-10%', description: 'Forest dwellers, strong traditional beliefs, Kumpo masquerade', color: '#2ECC71' },
  { name: 'Soninke', percentage: '8%', description: 'Traders, merchants, gold commerce', color: '#9B59B6' },
  { name: 'Serer', percentage: '<5%', description: 'Agricultural communities, coastal regions', color: '#3498DB' },
  { name: 'Manjago', percentage: '<5%', description: 'Forest communities, traditional hunters', color: '#F39C12' },
  { name: 'Aku', percentage: '<5%', description: 'Descendants of freed slaves, Christian communities', color: '#1ABC9C' }
];

const languages = [
  { name: 'English', type: 'Official', note: 'Government, education, business' },
  { name: 'Mandinka', type: 'Most widely spoken', note: '34-42% of population' },
  { name: 'Wolof', type: 'Urban lingua franca', note: 'Trade, music, media' },
  { name: 'Fula (Pulaar)', type: 'Pastoral communities', note: '22-25% of population' },
  { name: 'Jola-Fonyi', type: 'Southwestern regions', note: '9-10% of population' },
  { name: 'Serahule (Soninke)', type: 'Trading communities', note: '8% of population' }
];

const musicInstruments = [
  { name: 'Kora', type: '21-string harp-lute', playedBy: 'Griots (jalis)', note: 'National instrument' },
  { name: 'Balafon', type: 'Wooden-key xylophone', playedBy: 'Griots', note: 'Ancient Mali tradition' },
  { name: 'Kontingo', type: '3-string lute', playedBy: 'Griots', note: 'Smaller than kora' },
  { name: 'Birimintingo', type: 'Advanced improvisation', playedBy: 'Master musicians', note: 'Complex technique' },
  { name: 'Kumbengo', type: 'Cyclical foundation pattern', playedBy: 'All musicians', note: 'Repeating rhythmic base' }
];

const dances = [
  { name: 'Sewruba', origin: 'Mandinka', description: 'Traditional dance of grace and celebration' },
  { name: 'Kumpo', origin: 'Jola', description: 'Wild twirling grass-covered masquerade figure', video: true },
  { name: 'Bugarabu', origin: 'Jola', description: 'Rhythmic dance with bougarabou drums' },
  { name: 'Sembo', origin: 'Multi-ethnic', description: 'Dance of gratitude and hospitality' },
  { name: 'Jondon/Wolosodon', origin: 'Mandinka', description: 'Initiation dance for young adults' },
  { name: 'Dundunbah', origin: 'Wolof', description: 'Warrior/strength dance' }
];

const drumming = [
  { name: 'Sabar', origin: 'Wolof', played: 'With stick', context: 'Celebrations, dance' },
  { name: 'Djembe', origin: 'Mandinka', played: 'By hand', context: 'Community gatherings' },
  { name: 'Bougarabou', origin: 'Jola', played: '3-4 drum set', context: 'Bugarabu dance' },
  { name: 'Dundun', origin: 'Mandinka', played: 'Talking drum', context: 'Communication, ceremony' }
];

const food = [
  { name: 'Domoda', type: 'National dish', description: 'Peanut butter stew with meat and vegetables', ingredients: ['Peanut butter', 'Meat', 'Sweet potatoes', 'Carrots', 'Cabbage'] },
  { name: 'Benachin', type: 'Gambian Jollof', description: 'Rice cooked with tomato, fish, and vegetables', ingredients: ['Rice', 'Tomato paste', 'Fish', 'Vegetables', 'Spices'] },
  { name: 'Yassa', type: 'Chicken/Fish', description: 'Marinated in lemon and onion sauce', ingredients: ['Chicken/Fish', 'Lemons', 'Onions', 'Garlic', 'Mustard'] },
  { name: 'Superkanja', type: 'Okra stew', description: 'Okra-based stew with fish or meat', ingredients: ['Okra', 'Fish/Meat', 'Palm oil', 'Onions', 'Peppers'] },
  { name: 'Tapalapa', type: 'Bread', description: 'Traditional baguette-style bread', ingredients: ['Flour', 'Yeast', 'Water', 'Salt'] },
  { name: 'Akara', type: 'Snack', description: 'Bean fritters, deep-fried', ingredients: ['Black-eyed peas', 'Onions', 'Peppers', 'Oil'] },
  { name: 'Chakery', type: 'Dessert', description: 'Sweet couscous with yogurt and fruit', ingredients: ['Couscous', 'Yogurt', 'Sugar', 'Fruit', 'Vanilla'] }
];

const festivals = [
  { name: 'International Roots Homecoming Festival', frequency: 'Biennial', description: 'Celebrates diaspora connection to Kunta Kinteh' },
  { name: 'Banjul Cultural Festival', frequency: 'Annual', description: 'Showcases Gambian arts, music, dance' },
  { name: 'Kartong International Cultural Festival', frequency: 'Annual', description: 'Cross-border cultural exchange' },
  { name: 'Kankurang Festival', frequency: 'Annual (Janjanbureh)', description: 'Celebrates UNESCO-recognized masquerade' },
  { name: 'Independence Day', frequency: '18 February', description: 'National celebration of independence from UK (1965)' },
  { name: 'Eid al-Fitr (Koriteh)', frequency: 'Islamic calendar', description: 'End of Ramadan celebration' },
  { name: 'Eid al-Adha (Tabaski)', frequency: 'Islamic calendar', description: 'Festival of sacrifice' }
];

const masquerades = [
  { name: 'Kankurang', origin: 'Mandinka', status: 'UNESCO Heritage', description: 'Bark/leaf figure, enforces justice and protection during initiation', video: true },
  { name: 'Kumpo', origin: 'Jola', status: 'Traditional', description: 'Grass-covered figure that twirls wildly during festivals', video: true },
  { name: 'Zimba', origin: 'Wolof/Lebu', status: 'Traditional', description: 'Animal-inspired masks used in harvest celebrations' }
];

const wrestling = {
  name: 'Borreh',
  description: 'National sport of The Gambia',
  rules: 'Throw opponent to ground to win',
  context: 'Accompanied by drumming and griot praise-singing',
  hubs: ['Soma', 'Paradise Beach', 'Bakau']
};

const griots = {
  term: 'Jaliya',
  description: 'Hereditary musicians, historians, praise-singers',
  role: 'Preserve genealogies through Sunjata Epic',
  instruments: ['Kora', 'Balafon', 'Kontingo'],
  famous: ['Sona Jobarteh', 'Jaliba Kuyateh', 'Bai Konte', 'Foday Musa Suso']
};

const folklore = [
  { title: 'Sunjata Epic', type: 'Epic poem', description: 'Founder of Mali Empire, overcoming disability to claim throne' },
  { title: 'Ninki Nanka', type: 'Legend', description: 'River dragon legend, feared by fishermen' },
  { title: 'Animal Trickster Tales', type: 'Folklore', description: 'Hare trickster similar to Brer Rabbit' }
];

const proverbs = [
  { proverb: 'An empty bag cannot stand.', language: 'Mandinka', meaning: 'You need resources/support to be stable' },
  { proverb: 'The child that does not cry will die on its mother\'s back.', language: 'Mandinka', meaning: 'Speak up for your needs' },
  { proverb: 'Even the mightiest river starts as a small spring.', language: 'Wolof', meaning: 'Great things have humble beginnings' },
  { proverb: 'A crab does not give birth to a bird.', language: 'Fula', meaning: 'Like father, like son' },
  { proverb: 'The forest does not cry out when the trees fall.', language: 'Jola', meaning: 'Nature accepts change silently' }
];

const literaryIcons = [
  { name: 'Lenrie Peters', contribution: 'Founder of modern Gambian literature', works: ['Poems', 'The Second Round'] },
  { name: 'Ebou Dibba', contribution: 'Novelist', works: ['Chaff on the Wind'] },
  { name: 'Tijan Sallah', contribution: 'Poet and critic', works: ['Poems of the New Gambia'] }
];

const culturalAmbassadors = [
  { name: 'Sona Jobarteh', role: 'Kora player', note: 'First prominent female kora player internationally' },
  { name: 'Jaliba Kuyateh', role: 'Griot', note: 'Known as "King of Kora"' },
  { name: 'Bai Konte', role: 'Griot', note: 'Legendary griot family patriarch' },
  { name: 'Foday Musa Suso', role: 'Kora master', note: 'International collaborations' }
];

const localGames = [
  { name: 'Wari/Bao', type: 'Mancala variant', players: '2', description: 'Seed-sowing board game, strategic thinking' },
  { name: 'Traditional Wrestling', type: 'Sport', players: '2', description: 'Borreh matches at festivals' },
  { name: 'Children\'s Circle Games', type: 'Play', players: 'Multiple', description: 'Singing games in villages' }
];

const marriagePractices = [
  { stage: 'Family Negotiations', description: 'Families meet, kola nuts exchanged' },
  { stage: 'Dowry Discussions', description: 'Bride price (lantang) negotiated' },
  { stage: 'Nikkah (Islamic)', description: 'Islamic marriage contract signed' },
  { stage: 'Traditional Presentation', description: 'Bride presented to groom\'s family' },
  { stage: 'Celebrations', description: 'Multi-day events with music, dancing, feasting' }
];

const CulturalProverbWidget = () => {
  const [currentProverb, setCurrentProverb] = useState(proverbs[Math.floor(Math.random() * proverbs.length)]);
  const [isAnimating, setIsAnimating] = useState(false);

  const getNewProverb = () => {
    setIsAnimating(true);
    setTimeout(() => {
      const newProverb = proverbs[Math.floor(Math.random() * proverbs.length)];
      setCurrentProverb(newProverb);
      setIsAnimating(false);
    }, 300);
  };

  return (
    <div style={styles.proverbWidget}>
      <h3 style={styles.widgetTitle}>📜 Proverb of the Day</h3>
      <div style={styles.proverbBox}>
        <p style={`${styles.proverbText} ${isAnimating ? styles.fadeOut : styles.fadeIn}`}>
          "{currentProverb.proverb}"
        </p>
        <p style={styles.language}>- {currentProverb.language}</p>
        <div style={styles.meaningBox}>
          <p style={styles.meaning}>{currentProverb.meaning}</p>
        </div>
      </div>
      <button onClick={getNewProverb} style={styles.button}>
        🔄 New Proverb
      </button>
    </div>
  );
};

const GambianCultureHub = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleExpand = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div style={styles.container}>
      {/* Hero Section */}
      <div style={styles.hero}>
        <h1 style={styles.heroTitle}>🇬🇲 Discover The Gambia</h1>
        <p style={styles.heroSubtitle}>The Smiling Coast of Africa — Rich Heritage, Vibrant Culture</p>
        <CulturalProverbWidget />
      </div>

      {/* Tab Navigation */}
      <div style={styles.tabNav}>
        {['overview', 'ethnic', 'languages', 'music', 'dances', 'drumming', 'food', 'festivals', 'masquerades', 'wrestling', 'griots', 'folklore', 'literature', 'ambassadors', 'games', 'marriage'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={activeTab === tab ? styles.tabActive : styles.tab}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div style={styles.content}>
        {activeTab === 'overview' && (
          <div>
            <h2 style={styles.sectionTitle}>About The Gambia</h2>
            <p style={styles.paragraph}>The Gambia, officially the Republic of The Gambia, is the smallest country on mainland Africa, covering just 11,295 km². Despite its size, it boasts incredible cultural diversity with over 8 ethnic groups living in harmony.</p>
            <p style={styles.paragraph}>Known as "The Smiling Coast of Africa," Gambians are renowned for their hospitality, warmth, and rich cultural traditions spanning music, dance, cuisine, and oral history.</p>
            <div style={styles.statsGrid}>
              <div style={styles.statCard}><h3 style={styles.statNumber}>8+</h3><p style={styles.statLabel}>Ethnic Groups</p></div>
              <div style={styles.statCard}><h3 style={styles.statNumber}>5+</h3><p style={styles.statLabel}>Languages</p></div>
              <div style={styles.statCard}><h3 style={styles.statNumber}>UNESCO</h3><p style={styles.statLabel}>Kankurang Heritage</p></div>
              <div style={styles.statCard}><h3 style={styles.statNumber}>1965</h3><p style={styles.statLabel}>Independence Year</p></div>
            </div>
          </div>
        )}

        {activeTab === 'ethnic' && (
          <div>
            <h2 style={styles.sectionTitle}>👥 Ethnic Groups</h2>
            <div style={styles.cardGrid}>
              {ethnicGroups.map((group, idx) => (
                <div key={idx} style={{...styles.card, borderLeft: `4px solid ${group.color}`}}>
                  <h3 style={styles.cardTitle}>{group.name}</h3>
                  <p style={styles.cardPercentage}>{group.percentage}</p>
                  <p style={styles.cardDesc}>{group.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'languages' && (
          <div>
            <h2 style={styles.sectionTitle}>🗣️ Languages</h2>
            <div style={styles.listContainer}>
              {languages.map((lang, idx) => (
                <div key={idx} style={styles.listItem}>
                  <h4 style={styles.listItemTitle}>{lang.name}</h4>
                  <span style={styles.badge}>{lang.type}</span>
                  <p style={styles.listItemDesc}>{lang.note}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'music' && (
          <div>
            <h2 style={styles.sectionTitle}>🎵 Music & Instruments</h2>
            <div style={styles.cardGrid}>
              {musicInstruments.map((item, idx) => (
                <div key={idx} style={styles.card}>
                  <h3 style={styles.cardTitle}>{item.name}</h3>
                  <p style={styles.cardSubtitle}>{item.type}</p>
                  <p style={styles.cardDesc}><strong>Played by:</strong> {item.playedBy}</p>
                  <p style={styles.cardDesc}>{item.note}</p>
                </div>
              ))}
            </div>
            <div style={styles.infoBox}>
              <h3 style={styles.infoTitle}>Griot Tradition (Jaliya)</h3>
              <p style={styles.infoText}>{griots.description}</p>
              <p style={styles.infoText}><strong>Famous Griots:</strong> {griots.famous.join(', ')}</p>
            </div>
          </div>
        )}

        {activeTab === 'dances' && (
          <div>
            <h2 style={styles.sectionTitle}>💃 Traditional Dances</h2>
            <div style={styles.cardGrid}>
              {dances.map((dance, idx) => (
                <div key={idx} style={styles.card}>
                  <h3 style={styles.cardTitle}>{dance.name}</h3>
                  <p style={styles.cardSubtitle}>Origin: {dance.origin}</p>
                  <p style={styles.cardDesc}>{dance.description}</p>
                  {dance.video && <span style={styles.videoBadge}>🎥 Video Available</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'drumming' && (
          <div>
            <h2 style={styles.sectionTitle}>🥁 Drumming Traditions</h2>
            <div style={styles.cardGrid}>
              {drumming.map((drum, idx) => (
                <div key={idx} style={styles.card}>
                  <h3 style={styles.cardTitle}>{drum.name}</h3>
                  <p style={styles.cardSubtitle}>Origin: {drum.origin}</p>
                  <p style={styles.cardDesc}><strong>Played:</strong> {drum.played}</p>
                  <p style={styles.cardDesc}><strong>Context:</strong> {drum.context}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'food' && (
          <div>
            <h2 style={styles.sectionTitle}>🍲 Gambian Cuisine</h2>
            <div style={styles.cardGrid}>
              {food.map((dish, idx) => (
                <div key={idx} style={styles.card}>
                  <h3 style={styles.cardTitle}>{dish.name}</h3>
                  <span style={styles.badge}>{dish.type}</span>
                  <p style={styles.cardDesc}>{dish.description}</p>
                  <button 
                    onClick={() => toggleExpand(`food-${idx}`)} 
                    style={styles.expandButton}
                  >
                    {expandedSection === `food-${idx}` ? 'Hide' : 'Show'} Ingredients
                  </button>
                  {expandedSection === `food-${idx}` && (
                    <ul style={styles.ingredientList}>
                      {dish.ingredients.map((ing, i) => <li key={i} style={styles.ingredient}>{ing}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'festivals' && (
          <div>
            <h2 style={styles.sectionTitle}>🎉 Festivals & Celebrations</h2>
            <div style={styles.cardGrid}>
              {festivals.map((fest, idx) => (
                <div key={idx} style={styles.card}>
                  <h3 style={styles.cardTitle}>{fest.name}</h3>
                  <p style={styles.cardSubtitle}>{fest.frequency}</p>
                  <p style={styles.cardDesc}>{fest.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'masquerades' && (
          <div>
            <h2 style={styles.sectionTitle}>🎭 Masquerades</h2>
            <div style={styles.cardGrid}>
              {masquerades.map((masq, idx) => (
                <div key={idx} style={styles.card}>
                  <h3 style={styles.cardTitle}>{masq.name}</h3>
                  <span style={masq.status === 'UNESCO Heritage' ? styles.badgeUNESCO : styles.badge}>{masq.status}</span>
                  <p style={styles.cardSubtitle}>Origin: {masq.origin}</p>
                  <p style={styles.cardDesc}>{masq.description}</p>
                  {masq.video && <span style={styles.videoBadge}>🎥 Video Available</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'wrestling' && (
          <div>
            <h2 style={styles.sectionTitle}>🤼 Wrestling (Borreh)</h2>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>{wrestling.name} — {wrestling.description}</h3>
              <p style={styles.cardDesc}>{wrestling.rules}</p>
              <p style={styles.cardDesc}>{wrestling.context}</p>
              <h4 style={styles.cardSubtitle}>Famous Wrestling Hubs:</h4>
              <ul style={styles.list}>
                {wrestling.hubs.map((hub, idx) => <li key={idx} style={styles.listItem}>{hub}</li>)}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'griots' && (
          <div>
            <h2 style={styles.sectionTitle}>📜 Griot Traditions (Jaliya)</h2>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>{griots.term}</h3>
              <p style={styles.cardDesc}>{griots.description}</p>
              <p style={styles.cardDesc}><strong>Role:</strong> {griots.role}</p>
              <p style={styles.cardDesc}><strong>Instruments:</strong> {griots.instruments.join(', ')}</p>
              <h4 style={styles.cardSubtitle}>Famous Griots:</h4>
              <ul style={styles.list}>
                {griots.famous.map((name, idx) => <li key={idx} style={styles.listItem}>{name}</li>)}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'folklore' && (
          <div>
            <h2 style={styles.sectionTitle}>📖 Folklore & Legends</h2>
            <div style={styles.cardGrid}>
              {folklore.map((item, idx) => (
                <div key={idx} style={styles.card}>
                  <h3 style={styles.cardTitle}>{item.title}</h3>
                  <span style={styles.badge}>{item.type}</span>
                  <p style={styles.cardDesc}>{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'literature' && (
          <div>
            <h2 style={styles.sectionTitle}>📚 Literary Icons</h2>
            <div style={styles.cardGrid}>
              {literaryIcons.map((icon, idx) => (
                <div key={idx} style={styles.card}>
                  <h3 style={styles.cardTitle}>{icon.name}</h3>
                  <p style={styles.cardDesc}>{icon.contribution}</p>
                  <p style={styles.cardSubtitle}><strong>Works:</strong> {icon.works.join(', ')}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'ambassadors' && (
          <div>
            <h2 style={styles.sectionTitle}>🌟 Cultural Ambassadors</h2>
            <div style={styles.cardGrid}>
              {culturalAmbassadors.map((person, idx) => (
                <div key={idx} style={styles.card}>
                  <h3 style={styles.cardTitle}>{person.name}</h3>
                  <p style={styles.cardSubtitle}>{person.role}</p>
                  <p style={styles.cardDesc}>{person.note}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'games' && (
          <div>
            <h2 style={styles.sectionTitle}>🎮 Local Games</h2>
            <div style={styles.cardGrid}>
              {localGames.map((game, idx) => (
                <div key={idx} style={styles.card}>
                  <h3 style={styles.cardTitle}>{game.name}</h3>
                  <p style={styles.cardSubtitle}>{game.type} • {game.players} players</p>
                  <p style={styles.cardDesc}>{game.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'marriage' && (
          <div>
            <h2 style={styles.sectionTitle}>💍 Marriage Practices</h2>
            <div style={styles.timeline}>
              {marriagePractices.map((stage, idx) => (
                <div key={idx} style={styles.timelineItem}>
                  <div style={styles.timelineNumber}>{idx + 1}</div>
                  <div style={styles.timelineContent}>
                    <h3 style={styles.cardTitle}>{stage.stage}</h3>
                    <p style={styles.cardDesc}>{stage.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Styles
const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#12243A',
    color: '#EEF2F7',
    minHeight: '100vh'
  },
  hero: {
    textAlign: 'center',
    padding: '40px 20px',
    background: 'linear-gradient(135deg, #0D1B2A 0%, #12243A 100%)',
    borderRadius: '12px',
    marginBottom: '30px',
    border: '2px solid #C9A84C'
  },
  heroTitle: {
    fontSize: '3rem',
    color: '#C9A84C',
    marginBottom: '10px'
  },
  heroSubtitle: {
    fontSize: '1.2rem',
    color: '#0C7B7A',
    marginBottom: '30px'
  },
  proverbWidget: {
    backgroundColor: '#0D1B2A',
    padding: '20px',
    borderRadius: '8px',
    maxWidth: '600px',
    margin: '0 auto',
    border: '1px solid #C9A84C'
  },
  widgetTitle: {
    color: '#C9A84C',
    marginBottom: '15px',
    fontSize: '1.3rem'
  },
  proverbBox: {
    marginBottom: '20px'
  },
  proverbText: {
    fontSize: '1.4rem',
    fontStyle: 'italic',
    color: '#EEF2F7',
    marginBottom: '10px',
    lineHeight: '1.5',
    transition: 'opacity 0.3s ease'
  },
  language: {
    color: '#0C7B7A',
    fontSize: '0.95rem',
    fontWeight: 'bold'
  },
  meaningBox: {
    backgroundColor: '#12243A',
    padding: '12px',
    borderRadius: '6px',
    marginTop: '15px',
    borderLeft: '3px solid #0C7B7A'
  },
  meaning: {
    color: '#7A8FA6',
    fontSize: '0.9rem',
    margin: 0,
    lineHeight: '1.4'
  },
  button: {
    padding: '10px 24px',
    backgroundColor: '#0C7B7A',
    color: '#EEF2F7',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 'bold',
    transition: 'background-color 0.2s'
  },
  tabNav: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '30px',
    justifyContent: 'center'
  },
  tab: {
    padding: '8px 16px',
    backgroundColor: '#0D1B2A',
    color: '#7A8FA6',
    border: '1px solid #7A8FA6',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.85rem'
  },
  tabActive: {
    padding: '8px 16px',
    backgroundColor: '#C9A84C',
    color: '#0D1B2A',
    border: '1px solid #C9A84C',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.85rem'
  },
  content: {
    backgroundColor: '#0D1B2A',
    padding: '30px',
    borderRadius: '12px'
  },
  sectionTitle: {
    color: '#C9A84C',
    fontSize: '2rem',
    marginBottom: '20px',
    borderBottom: '2px solid #0C7B7A',
    paddingBottom: '10px'
  },
  paragraph: {
    lineHeight: '1.6',
    marginBottom: '15px',
    color: '#EEF2F7'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginTop: '30px'
  },
  statCard: {
    backgroundColor: '#12243A',
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'center',
    border: '1px solid #0C7B7A'
  },
  statNumber: {
    color: '#C9A84C',
    fontSize: '2rem',
    margin: '10px 0'
  },
  statLabel: {
    color: '#7A8FA6',
    fontSize: '0.9rem'
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px'
  },
  card: {
    backgroundColor: '#12243A',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #7A8FA6'
  },
  cardTitle: {
    color: '#C9A84C',
    marginBottom: '10px'
  },
  cardSubtitle: {
    color: '#0C7B7A',
    fontSize: '0.9rem',
    marginBottom: '10px'
  },
  cardPercentage: {
    color: '#0C7B7A',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: '10px'
  },
  cardDesc: {
    color: '#EEF2F7',
    fontSize: '0.95rem',
    lineHeight: '1.5'
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  listItem: {
    backgroundColor: '#12243A',
    padding: '15px',
    borderRadius: '8px',
    borderLeft: '4px solid #0C7B7A'
  },
  listItemTitle: {
    color: '#C9A84C',
    marginBottom: '5px'
  },
  listItemDesc: {
    color: '#EEF2F7',
    fontSize: '0.95rem'
  },
  badge: {
    display: 'inline-block',
    padding: '4px 12px',
    backgroundColor: '#0C7B7A',
    color: '#EEF2F7',
    borderRadius: '12px',
    fontSize: '0.8rem',
    marginBottom: '10px'
  },
  badgeUNESCO: {
    display: 'inline-block',
    padding: '4px 12px',
    backgroundColor: '#E74C3C',
    color: '#EEF2F7',
    borderRadius: '12px',
    fontSize: '0.8rem',
    marginBottom: '10px'
  },
  videoBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    backgroundColor: '#9B59B6',
    color: '#EEF2F7',
    borderRadius: '12px',
    fontSize: '0.8rem',
    marginTop: '10px'
  },
  infoBox: {
    backgroundColor: '#12243A',
    padding: '20px',
    borderRadius: '8px',
    marginTop: '30px',
    border: '2px solid #C9A84C'
  },
  infoTitle: {
    color: '#C9A84C',
    marginBottom: '10px'
  },
  infoText: {
    color: '#EEF2F7',
    lineHeight: '1.5',
    marginBottom: '10px'
  },
  expandButton: {
    padding: '6px 12px',
    backgroundColor: '#0C7B7A',
    color: '#EEF2F7',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    marginTop: '10px'
  },
  ingredientList: {
    marginTop: '10px',
    paddingLeft: '20px',
    color: '#EEF2F7'
  },
  ingredient: {
    marginBottom: '5px',
    lineHeight: '1.4'
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  timelineItem: {
    display: 'flex',
    gap: '20px',
    alignItems: 'flex-start'
  },
  timelineNumber: {
    width: '40px',
    height: '40px',
    backgroundColor: '#C9A84C',
    color: '#0D1B2A',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    flexShrink: 0
  },
  timelineContent: {
    flex: 1,
    backgroundColor: '#12243A',
    padding: '15px',
    borderRadius: '8px'
  },
  list: {
    paddingLeft: '20px',
    color: '#EEF2F7'
  },
  fadeIn: { opacity: 1 },
  fadeOut: { opacity: 0 }
};

export default GambianCultureHub;
