import React, { useState } from 'react';

const quizQuestions = [
  {
    question: 'What is the largest ethnic group in The Gambia?',
    options: ['Wolof', 'Fula', 'Mandinka', 'Jola'],
    correct: 2,
    fact: 'Mandinka people make up 34-42% of The Gambia\'s population and are descendants of the Mali Empire.'
  },
  {
    question: 'What is the national dish of The Gambia?',
    options: ['Jollof Rice', 'Domoda', 'Yassa', 'Benachin'],
    correct: 1,
    fact: 'Domoda is a rich peanut butter stew considered the national dish of The Gambia.'
  },
  {
    question: 'Which instrument has 21 strings and is played by Griots?',
    options: ['Balafon', 'Kora', 'Djembe', 'Kontingo'],
    correct: 1,
    fact: 'The Kora is a 21-string harp-lute traditionally played by Griots (Jalis) to preserve history through music.'
  },
  {
    question: 'What does "Jaliya" refer to?',
    options: ['A type of dance', 'Griot tradition', 'A food dish', 'A wrestling style'],
    correct: 1,
    fact: 'Jaliya is the hereditary tradition of Griots who serve as musicians, historians, and praise-singers.'
  },
  {
    question: 'Which masquerade is recognized by UNESCO?',
    options: ['Kumpo', 'Zimba', 'Kankurang', 'All of the above'],
    correct: 2,
    fact: 'The Kankurang masquerade was inscribed on UNESCO\'s Representative List of the Intangible Cultural Heritage of Humanity in 2005.'
  },
  {
    question: 'What is "Borreh"?',
    options: ['A type of food', 'Traditional wrestling', 'A festival', 'A dance'],
    correct: 1,
    fact: 'Borreh is the traditional wrestling of The Gambia, accompanied by drumming and Griot praise-singing.'
  },
  {
    question: 'Which language is most widely spoken in The Gambia?',
    options: ['English', 'Wolof', 'Mandinka', 'Fula'],
    correct: 2,
    fact: 'While English is the official language, Mandinka is the most widely spoken language in The Gambia.'
  },
  {
    question: 'What is "Tapalapa"?',
    options: ['A dance', 'Traditional bread', 'A drum', 'A festival'],
    correct: 1,
    fact: 'Tapalapa is a baguette-style bread that is a staple in Gambian cuisine, often served with stews.'
  },
  {
    question: 'Who is considered the first prominent female Kora player?',
    options: ['Jaliba Kuyateh', 'Sona Jobarteh', 'Bai Konte', 'Foday Musa Suso'],
    correct: 1,
    fact: 'Sona Jobarteh is recognized as the first female Kora player to come from a Griot family, breaking a 700-year male tradition.'
  },
  {
    question: 'What is the "Sunjata Epic"?',
    options: ['A Gambian folk tale', 'Founder of Mali Empire', 'A type of food', 'A wrestling move'],
    correct: 1,
    fact: 'The Sunjata Epic tells the story of Sunjata Keita, who founded the Mali Empire in the 13th century and overcame physical disability to claim his throne.'
  }
];

const CulturalQuiz = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [answers, setAnswers] = useState([]);

  const handleAnswer = (optionIdx) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(optionIdx);
    const isCorrect = optionIdx === quizQuestions[currentQuestion].correct;
    
    if (isCorrect) {
      setScore(score + 1);
    }
    
    setAnswers([...answers, { question: currentQuestion, selected: optionIdx, correct: isCorrect }]);
    
    setTimeout(() => {
      if (currentQuestion < quizQuestions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
      } else {
        setQuizCompleted(true);
      }
    }, 1500);
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setScore(0);
    setShowResult(false);
    setQuizCompleted(false);
    setAnswers([]);
  };

  const getScoreMessage = () => {
    const percentage = (score / quizQuestions.length) * 100;
    if (percentage >= 90) return '🏆 Cultural Master! You know The Gambia inside out!';
    if (percentage >= 70) return '🌟 Great job! You have a solid understanding of Gambian culture.';
    if (percentage >= 50) return '📚 Good effort! Keep learning about this rich culture.';
    return '🌍 Just getting started? Explore the culture hub and try again!';
  };

  if (quizCompleted) {
    return (
      <div style={styles.container}>
        <div style={styles.resultCard}>
          <h2 style={styles.resultTitle}>🎉 Quiz Completed!</h2>
          <div style={styles.scoreDisplay}>
            <h1 style={styles.score}>{score}/{quizQuestions.length}</h1>
            <p style={styles.percentage}>{Math.round((score / quizQuestions.length) * 100)}%</p>
          </div>
          <p style={styles.message}>{getScoreMessage()}</p>
          
          <div style={styles.breakdown}>
            <h3 style={styles.breakdownTitle}>Question Breakdown:</h3>
            {answers.map((answer, idx) => (
              <div key={idx} style={styles.answerRow}>
                <span style={answer.correct ? styles.correctIcon : styles.wrongIcon}>
                  {answer.correct ? '✅' : '❌'}
                </span>
                <span style={styles.questionText}>Q{idx + 1}: {quizQuestions[idx].question}</span>
              </div>
            ))}
          </div>
          
          <button onClick={restartQuiz} style={styles.restartButton}>
            🔄 Take Quiz Again
          </button>
        </div>
      </div>
    );
  }

  const question = quizQuestions[currentQuestion];

  return (
    <div style={styles.container}>
      <div style={styles.quizCard}>
        <div style={styles.progressBar}>
          <div style={{...styles.progressFill, width: `${((currentQuestion) / quizQuestions.length) * 100}%`}}></div>
        </div>
        <p style={styles.progressText}>Question {currentQuestion + 1} of {quizQuestions.length}</p>
        
        <h2 style={styles.question}>{question.question}</h2>
        
        <div style={styles.optionsGrid}>
          {question.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              disabled={selectedAnswer !== null}
              style={
                selectedAnswer === idx
                  ? idx === question.correct
                    ? styles.optionCorrect
                    : styles.optionWrong
                  : selectedAnswer !== null && idx === question.correct
                  ? styles.optionCorrect
                  : styles.option
              }
            >
              {option}
              {selectedAnswer !== null && idx === question.correct && <span style={styles.correctBadge}>✓ Correct</span>}
              {selectedAnswer === idx && idx !== question.correct && <span style={styles.wrongBadge}>✗ Wrong</span>}
            </button>
          ))}
        </div>
        
        {selectedAnswer !== null && (
          <div style={styles.factBox}>
            <h4 style={styles.factTitle}>📖 Did You Know?</h4>
            <p style={styles.factText}>{question.fact}</p>
          </div>
        )}
        
        <div style={styles.scoreTracker}>
          <span style={styles.scoreLabel}>Current Score:</span>
          <span style={styles.scoreValue}>{score}/{currentQuestion + (selectedAnswer !== null ? 1 : 0)}</span>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    color: '#EEF2F7'
  },
  quizCard: {
    backgroundColor: '#0D1B2A',
    padding: '30px',
    borderRadius: '12px',
    border: '2px solid #C9A84C'
  },
  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: '#12243A',
    borderRadius: '4px',
    marginBottom: '10px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0C7B7A',
    borderRadius: '4px',
    transition: 'width 0.3s ease'
  },
  progressText: {
    color: '#7A8FA6',
    fontSize: '0.9rem',
    marginBottom: '20px'
  },
  question: {
    color: '#C9A84C',
    fontSize: '1.5rem',
    marginBottom: '25px',
    lineHeight: '1.4'
  },
  optionsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '25px'
  },
  option: {
    padding: '15px',
    backgroundColor: '#12243A',
    color: '#EEF2F7',
    border: '1px solid #7A8FA6',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    textAlign: 'left',
    transition: 'all 0.2s'
  },
  optionCorrect: {
    padding: '15px',
    backgroundColor: '#0C7B7A',
    color: '#EEF2F7',
    border: '2px solid #2ECC71',
    borderRadius: '8px',
    cursor: 'default',
    fontSize: '1rem',
    textAlign: 'left'
  },
  optionWrong: {
    padding: '15px',
    backgroundColor: '#E74C3C',
    color: '#EEF2F7',
    border: '2px solid #C0392B',
    borderRadius: '8px',
    cursor: 'default',
    fontSize: '1rem',
    textAlign: 'left'
  },
  correctBadge: {
    marginLeft: '10px',
    color: '#2ECC71',
    fontWeight: 'bold'
  },
  wrongBadge: {
    marginLeft: '10px',
    color: '#E74C3C',
    fontWeight: 'bold'
  },
  factBox: {
    backgroundColor: '#12243A',
    padding: '15px',
    borderRadius: '8px',
    borderLeft: '4px solid #C9A84C',
    marginBottom: '20px'
  },
  factTitle: {
    color: '#C9A84C',
    marginBottom: '8px',
    fontSize: '1rem'
  },
  factText: {
    color: '#EEF2F7',
    lineHeight: '1.5',
    margin: 0
  },
  scoreTracker: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 15px',
    backgroundColor: '#12243A',
    borderRadius: '6px'
  },
  scoreLabel: {
    color: '#7A8FA6',
    fontSize: '0.9rem'
  },
  scoreValue: {
    color: '#C9A84C',
    fontSize: '1.1rem',
    fontWeight: 'bold'
  },
  resultCard: {
    backgroundColor: '#0D1B2A',
    padding: '40px',
    borderRadius: '12px',
    border: '2px solid #C9A84C',
    textAlign: 'center'
  },
  resultTitle: {
    color: '#C9A84C',
    fontSize: '2rem',
    marginBottom: '30px'
  },
  scoreDisplay: {
    marginBottom: '20px'
  },
  score: {
    color: '#EEF2F7',
    fontSize: '3rem',
    margin: '10px 0'
  },
  percentage: {
    color: '#0C7B7A',
    fontSize: '1.5rem',
    fontWeight: 'bold'
  },
  message: {
    color: '#EEF2F7',
    fontSize: '1.2rem',
    marginBottom: '30px',
    fontStyle: 'italic'
  },
  breakdown: {
    textAlign: 'left',
    marginBottom: '30px'
  },
  breakdownTitle: {
    color: '#C9A84C',
    marginBottom: '15px'
  },
  answerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '8px',
    padding: '8px',
    backgroundColor: '#12243A',
    borderRadius: '4px'
  },
  correctIcon: {
    color: '#2ECC71',
    fontSize: '1.2rem'
  },
  wrongIcon: {
    color: '#E74C3C',
    fontSize: '1.2rem'
  },
  questionText: {
    color: '#EEF2F7',
    fontSize: '0.95rem'
  },
  restartButton: {
    padding: '12px 30px',
    backgroundColor: '#C9A84C',
    color: '#0D1B2A',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '1.1rem',
    fontWeight: 'bold'
  }
};

export default CulturalQuiz;
