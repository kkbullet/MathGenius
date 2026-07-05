/**
 * Math Puzzle Generator Engine
 * Scales difficulty dynamically based on the user's current score.
 */

const OPERATIONS = {
  ADD: 'ADD',
  SUBTRACT: 'SUBTRACT',
  MULTIPLY: 'MULTIPLY',
  DIVIDE: 'DIVIDE',
  ALGEBRA: 'ALGEBRA'
};

/**
 * Returns a random integer between min and max inclusive.
 */
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generates a puzzle object: { question: string, answer: number }
 * @param {number} score - Current user score used for difficulty scaling
 */
export function generatePuzzle(score) {
  let difficulty = 1;
  if (score >= 25) {
    difficulty = 4; // Hardest (Algebra + hard operations)
  } else if (score >= 15) {
    difficulty = 3; // Intermediate-hard (Multiplication/division with larger numbers)
  } else if (score >= 6) {
    difficulty = 2; // Intermediate (Simple multiplication, double digits)
  }

  const opChoice = getRandomInt(1, 100);

  if (difficulty === 1) {
    // Phase 1: Simple single digit addition/subtraction
    if (opChoice <= 50) {
      // Addition: A + B, A, B in [1, 9]
      const a = getRandomInt(1, 9);
      const b = getRandomInt(1, 9);
      return {
        question: `${a} + ${b}`,
        answer: a + b
      };
    } else {
      // Subtraction: A - B, answer >= 0
      const a = getRandomInt(2, 9);
      const b = getRandomInt(1, a - 1);
      return {
        question: `${a} - ${b}`,
        answer: a - b
      };
    }
  }

  if (difficulty === 2) {
    // Phase 2: Double-digit add/sub or simple multiplication
    if (opChoice <= 35) {
      // Addition: A + B, A in [10, 50], B in [5, 20]
      const a = getRandomInt(10, 50);
      const b = getRandomInt(5, 20);
      return {
        question: `${a} + ${b}`,
        answer: a + b
      };
    } else if (opChoice <= 70) {
      // Subtraction: A - B, A in [15, 50], B in [5, 20]
      const a = getRandomInt(15, 50);
      const b = getRandomInt(5, a - 5);
      return {
        question: `${a} - ${b}`,
        answer: a - b
      };
    } else {
      // Multiplication: A * B, A in [2, 9], B in [2, 9]
      const a = getRandomInt(2, 9);
      const b = getRandomInt(2, 9);
      return {
        question: `${a} × ${b}`,
        answer: a * b
      };
    }
  }

  if (difficulty === 3) {
    // Phase 3: Larger addition/subtraction, division (whole results)
    if (opChoice <= 30) {
      // Double digit addition: A + B, A, B in [10, 99]
      const a = getRandomInt(10, 99);
      const b = getRandomInt(10, 99);
      return {
        question: `${a} + ${b}`,
        answer: a + b
      };
    } else if (opChoice <= 60) {
      // Double digit subtraction: A - B, A in [30, 99], B in [10, A-5]
      const a = getRandomInt(30, 99);
      const b = getRandomInt(10, a - 5);
      return {
        question: `${a} - ${b}`,
        answer: a - b
      };
    } else if (opChoice <= 80) {
      // Multiplication: A * B, A in [2, 12], B in [3, 15]
      const a = getRandomInt(2, 12);
      const b = getRandomInt(3, 15);
      return {
        question: `${a} × ${b}`,
        answer: a * b
      };
    } else {
      // Division: A / B, resulting in integer
      // We generate the answer first: answer = A / B => choose answer and B, compute A = answer * B
      const ans = getRandomInt(2, 10);
      const b = getRandomInt(2, 10);
      const a = ans * b;
      return {
        question: `${a} ÷ ${b}`,
        answer: ans
      };
    }
  }

  // Phase 4: Hard operations + simple algebra
  if (opChoice <= 30) {
    // Algebra: X + A = B or X - A = B
    const x = getRandomInt(2, 20);
    const a = getRandomInt(3, 15);
    const isAdd = Math.random() > 0.5;
    if (isAdd) {
      // X + A = B => question: X + a = b => x + 5 = 12 => answer: x
      const b = x + a;
      return {
        question: `X + ${a} = ${b}`,
        description: 'Solve for X',
        answer: x
      };
    } else {
      // X - A = B => question: X - a = b => x - 5 = 7 => answer: x
      const b = x - a;
      return {
        question: `X - ${a} = ${b}`,
        description: 'Solve for X',
        answer: x
      };
    }
  } else if (opChoice <= 55) {
    // Algebra: kX = B => 3X = 24 => X = 8
    const x = getRandomInt(2, 12);
    const k = getRandomInt(2, 9);
    const b = k * x;
    return {
      question: `${k}X = ${b}`,
      description: 'Solve for X',
      answer: x
    };
  } else if (opChoice <= 80) {
    // Hard division: A / B, resulting in larger integer
    const ans = getRandomInt(5, 20);
    const b = getRandomInt(3, 12);
    const a = ans * b;
    return {
      question: `${a} ÷ ${b}`,
      answer: ans
    };
  } else {
    // Multiplication: A * B, A in [11, 25], B in [2, 9]
    const a = getRandomInt(11, 25);
    const b = getRandomInt(2, 9);
    return {
      question: `${a} × ${b}`,
      answer: a * b
    };
  }
}

/**
 * Validates a user's answer against the puzzle
 * @param {object} puzzle - The puzzle object
 * @param {string|number} userAnswer - The user input answer
 * @returns {boolean}
 */
export function checkAnswer(puzzle, userAnswer) {
  if (userAnswer === undefined || userAnswer === null) return false;
  const parsed = parseInt(userAnswer.toString().trim(), 10);
  return parsed === puzzle.answer;
}
