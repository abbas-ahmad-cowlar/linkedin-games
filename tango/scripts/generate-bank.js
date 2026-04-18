/**
 * Generate the 20-puzzle JSON bank for Tango.
 * Run with: node scripts/generate-bank.js
 */

import { createRNG } from '../src/shared/rng.js';
import { generatePuzzle } from '../src/games/tango/tango-generator.js';
import { hasUniqueSolution } from '../src/games/tango/tango-solver.js';
import { checkWin } from '../src/games/tango/tango-logic.js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';

const COUNT = 20;
const difficulties = ['easy', 'medium', 'hard'];
const bank = [];

console.log('Generating 20 Tango puzzles...\n');

for (let i = 0; i < COUNT; i++) {
  const seed = 10000 + i * 7; // Spread seeds
  const rng = createRNG(seed);
  const diff = difficulties[i % 3]; // Cycle through difficulties
  const puzzle = generatePuzzle(diff, rng);

  // Validate
  const solutionValid = checkWin(puzzle.solution, puzzle.constraints);
  const unique = hasUniqueSolution(puzzle.puzzle, puzzle.constraints);
  const filledCount = puzzle.puzzle.flat().filter(c => c !== null).length;

  console.log(`  Puzzle ${i + 1}: ${diff.padEnd(6)} | ${filledCount} givens | ${puzzle.constraints.length} constraints | valid=${solutionValid} | unique=${unique}`);

  if (!solutionValid || !unique) {
    console.error(`  ❌ FAILED validation for puzzle ${i + 1}!`);
    process.exit(1);
  }

  bank.push({
    id: i + 1,
    difficulty: diff,
    puzzle: puzzle.puzzle,
    constraints: puzzle.constraints,
    solution: puzzle.solution,
  });
}

// Write to public/data/
const outDir = 'public/data';
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const outPath = `${outDir}/tango-levels.json`;
writeFileSync(outPath, JSON.stringify(bank, null, 2));
console.log(`\n✅ Written ${COUNT} puzzles to ${outPath}`);
