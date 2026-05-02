import React, { useState } from 'react';

const proverbs = [
  { proverb: 'An empty bag cannot stand.', language: 'Mandinka', meaning: 'You need resources/support to be stable' },
  { proverb: 'The child that does not cry will die on its mother\'s back.', language: 'Mandinka', meaning: 'Speak up for your needs' },
  { proverb: 'Even the mightiest river starts as a small spring.', language: 'Wolof', meaning: 'Great things have humble beginnings' },
  { proverb: 'A crab does not give birth to a bird.', language: 'Fula', meaning: 'Like father, like son' },
  { proverb: 'The forest does not cry out when the trees fall.', language: 'Jola', meaning: 'Nature accepts change silently' },
  { proverb: 'Wisdom is like a baobab tree; no one person can embrace it.', language: 'Mandinka', meaning: 'Knowledge is vast and collective' },
  { proverb: 'The lizard that jumps from the high iroko tree to the ground says it will praise itself if no one else will.', language: 'Wolof', meaning: 'Self-reliance and self-praise when others fail to acknowledge' },
  { proverb: 'However long the night, daylight comes.', language: 'Fula', meaning: 'Difficult times eventually end' },
  { proverb: 'The cock that crows at the wrong time is sacrificed.', language: 'Jola', meaning: 'Timing is crucial; misjudgment has consequences' },
  { proverb: 'A single bracelet does not jingle.', language: 'Mandinka', meaning: 'Unity and collaboration produce results' },
  { proverb: 'The ruin of a nation begins in the homes of its people.', language: 'Wolof', meaning: 'Societal problems start at the family level' },
  { proverb: 'When the music changes, so does the dance.', language: 'Fula', meaning: 'Adapt to changing circumstances' },
  { proverb: 'The child who is not embraced by the village will burn it down to feel its warmth.', language: 'Mandinka', meaning: 'Neglected individuals can become destructive' },
  { proverb: 'A cutting word is worse than a bowstring; it leaves no mark but festers inward.', language: 'Jola', meaning: 'Harsh words cause deep emotional wounds' },
  { proverb: 'The millet that is not guarded by the dog is eaten by the birds.', language: 'Soninke', meaning: 'Without protection, resources are vulnerable' },
  { proverb: 'One finger cannot kill a louse.', language: 'Wolof', meaning: 'Cooperation is needed for success' },
  { proverb: 'The snake that is too big for the hole cannot be forced in.', language: 'Fula', meaning: 'Know your limits and fit where you belong' },
  { proverb: 'A tree never hits an ax during a storm; it knows the value of its roots.', language: 'Mandinka', meaning: 'Stay grounded and appreciate your foundation' },
  { proverb: 'The frog eats what it can swallow, not what it can catch.', language: 'Jola', meaning: 'Be realistic about your capacity' },
  { proverb: 'A river does not dry up because of one dry season.', language: 'Soninke', meaning: 'One setback does not define the future' }
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
    <div style={styles.container}>
      <h3 style={styles.title}>📜 Proverb of the Day</h3>
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
      <p style={styles.counter}>Proverb #{proverbs.indexOf(currentProverb) + 1} of {proverbs.length}</p>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: '#0D1B2A',
    padding: '20px',
    borderRadius: '8px',
    maxWidth: '600px',
    margin: '20px auto',
    border: '2px solid #C9A84C',
    textAlign: 'center'
  },
  title: {
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
  counter: {
    color: '#7A8FA6',
    fontSize: '0.8rem',
    marginTop: '10px'
  },
  fadeIn: { opacity: 1 },
  fadeOut: { opacity: 0 }
};

export default CulturalProverbWidget;
