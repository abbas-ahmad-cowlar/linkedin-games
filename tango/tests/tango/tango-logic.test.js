import { describe, it, expect } from 'vitest';
import {
  SIZE,
  SYM,
  CONSTRAINT,
  createBoard,
  cloneBoard,
  opposite,
  inBounds,
  countInRow,
  countInCol,
  isFilled,
  boardToString,
  checkBalance,
  checkNoThree,
  checkConstraints,
  isValidPlacement,
  checkWin,
} from '../../src/games/tango/tango-logic.js';

// ─── Helper: create a known valid complete board ─────────────────────────────

function makeValidBoard() {
  // Generator-verified valid 6×6 board (seed 42): balanced, no triple, no violations
  return [
    [SYM.MOON, SYM.SUN, SYM.MOON, SYM.MOON, SYM.SUN, SYM.SUN],
    [SYM.SUN, SYM.MOON, SYM.MOON, SYM.SUN, SYM.SUN, SYM.MOON],
    [SYM.MOON, SYM.SUN, SYM.SUN, SYM.MOON, SYM.MOON, SYM.SUN],
    [SYM.SUN, SYM.SUN, SYM.MOON, SYM.SUN, SYM.MOON, SYM.MOON],
    [SYM.SUN, SYM.MOON, SYM.SUN, SYM.MOON, SYM.SUN, SYM.MOON],
    [SYM.MOON, SYM.MOON, SYM.SUN, SYM.SUN, SYM.MOON, SYM.SUN],
  ];
}

// ─── Board Utilities ─────────────────────────────────────────────────────────

describe('createBoard', () => {
  it('returns a 6×6 grid of nulls', () => {
    const board = createBoard();
    expect(board.length).toBe(6);
    board.forEach((row) => {
      expect(row.length).toBe(6);
      row.forEach((cell) => expect(cell).toBeNull());
    });
  });
});

describe('cloneBoard', () => {
  it('creates an independent copy', () => {
    const board = createBoard();
    board[0][0] = SYM.SUN;
    const clone = cloneBoard(board);
    clone[0][0] = SYM.MOON;
    expect(board[0][0]).toBe(SYM.SUN);
    expect(clone[0][0]).toBe(SYM.MOON);
  });

  it('preserves all values', () => {
    const board = makeValidBoard();
    const clone = cloneBoard(board);
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        expect(clone[r][c]).toBe(board[r][c]);
      }
    }
  });
});

describe('opposite', () => {
  it('sun → moon', () => expect(opposite(SYM.SUN)).toBe(SYM.MOON));
  it('moon → sun', () => expect(opposite(SYM.MOON)).toBe(SYM.SUN));
});

describe('inBounds', () => {
  it('accepts (0,0)', () => expect(inBounds(0, 0)).toBe(true));
  it('accepts (5,5)', () => expect(inBounds(5, 5)).toBe(true));
  it('accepts (3,2)', () => expect(inBounds(3, 2)).toBe(true));
  it('rejects (-1,0)', () => expect(inBounds(-1, 0)).toBe(false));
  it('rejects (6,0)', () => expect(inBounds(6, 0)).toBe(false));
  it('rejects (0,-1)', () => expect(inBounds(0, -1)).toBe(false));
  it('rejects (0,6)', () => expect(inBounds(0, 6)).toBe(false));
});

describe('countInRow', () => {
  it('counts suns in a mixed row', () => {
    const board = createBoard();
    board[0] = [SYM.SUN, SYM.MOON, SYM.SUN, null, null, SYM.SUN];
    expect(countInRow(board, 0, SYM.SUN)).toBe(3);
    expect(countInRow(board, 0, SYM.MOON)).toBe(1);
  });

  it('returns 0 for empty row', () => {
    const board = createBoard();
    expect(countInRow(board, 0, SYM.SUN)).toBe(0);
  });
});

describe('countInCol', () => {
  it('counts moons in a column', () => {
    const board = createBoard();
    board[0][2] = SYM.MOON;
    board[1][2] = SYM.MOON;
    board[3][2] = SYM.SUN;
    expect(countInCol(board, 2, SYM.MOON)).toBe(2);
    expect(countInCol(board, 2, SYM.SUN)).toBe(1);
  });
});

describe('isFilled', () => {
  it('returns false for empty board', () => {
    expect(isFilled(createBoard())).toBe(false);
  });

  it('returns false with one empty cell', () => {
    const board = makeValidBoard();
    board[3][3] = null;
    expect(isFilled(board)).toBe(false);
  });

  it('returns true for complete board', () => {
    expect(isFilled(makeValidBoard())).toBe(true);
  });
});

describe('boardToString', () => {
  it('formats correctly', () => {
    const board = createBoard();
    board[0][0] = SYM.SUN;
    board[0][1] = SYM.MOON;
    const str = boardToString(board);
    expect(str.startsWith('S M . . . .')).toBe(true);
  });
});

// ─── Rule Validators ─────────────────────────────────────────────────────────

describe('checkBalance', () => {
  it('allows placement when row has room', () => {
    const board = createBoard();
    board[0][0] = SYM.SUN;
    board[0][1] = SYM.SUN;
    const result = checkBalance(board, 0, 2, SYM.SUN);
    expect(result.valid).toBe(true);
  });

  it('rejects when row already has 3 of the symbol', () => {
    const board = createBoard();
    board[0][0] = SYM.SUN;
    board[0][1] = SYM.SUN;
    board[0][2] = SYM.SUN;
    const result = checkBalance(board, 0, 3, SYM.SUN);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Row');
  });

  it('rejects when column already has 3 of the symbol', () => {
    const board = createBoard();
    board[0][0] = SYM.MOON;
    board[1][0] = SYM.MOON;
    board[2][0] = SYM.MOON;
    const result = checkBalance(board, 3, 0, SYM.MOON);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Col');
  });

  it('allows the other symbol even when one is full', () => {
    const board = createBoard();
    board[0][0] = SYM.SUN;
    board[0][1] = SYM.SUN;
    board[0][2] = SYM.SUN;
    const result = checkBalance(board, 0, 3, SYM.MOON);
    expect(result.valid).toBe(true);
  });
});

describe('checkNoThree', () => {
  it('rejects three suns in a row (left pair)', () => {
    const board = createBoard();
    board[0][0] = SYM.SUN;
    board[0][1] = SYM.SUN;
    const result = checkNoThree(board, 0, 2, SYM.SUN);
    expect(result.valid).toBe(false);
  });

  it('rejects three in a row (center)', () => {
    const board = createBoard();
    board[0][0] = SYM.MOON;
    board[0][2] = SYM.MOON;
    const result = checkNoThree(board, 0, 1, SYM.MOON);
    expect(result.valid).toBe(false);
  });

  it('rejects three in a row (right pair)', () => {
    const board = createBoard();
    board[0][1] = SYM.SUN;
    board[0][2] = SYM.SUN;
    const result = checkNoThree(board, 0, 0, SYM.SUN);
    expect(result.valid).toBe(false);
  });

  it('rejects three in a column (top pair)', () => {
    const board = createBoard();
    board[0][0] = SYM.SUN;
    board[1][0] = SYM.SUN;
    const result = checkNoThree(board, 2, 0, SYM.SUN);
    expect(result.valid).toBe(false);
  });

  it('rejects three in a column (center)', () => {
    const board = createBoard();
    board[0][0] = SYM.MOON;
    board[2][0] = SYM.MOON;
    const result = checkNoThree(board, 1, 0, SYM.MOON);
    expect(result.valid).toBe(false);
  });

  it('rejects three in a column (bottom pair)', () => {
    const board = createBoard();
    board[1][0] = SYM.SUN;
    board[2][0] = SYM.SUN;
    const result = checkNoThree(board, 0, 0, SYM.SUN);
    expect(result.valid).toBe(false);
  });

  it('allows two in a row (not three)', () => {
    const board = createBoard();
    board[0][0] = SYM.SUN;
    const result = checkNoThree(board, 0, 1, SYM.SUN);
    expect(result.valid).toBe(true);
  });

  it('allows different symbols adjacent', () => {
    const board = createBoard();
    board[0][0] = SYM.MOON;
    board[0][1] = SYM.SUN;
    const result = checkNoThree(board, 0, 2, SYM.SUN);
    expect(result.valid).toBe(true);
  });

  it('handles edge cell (0,0) correctly', () => {
    const board = createBoard();
    const result = checkNoThree(board, 0, 0, SYM.SUN);
    expect(result.valid).toBe(true);
  });

  it('handles edge cell (5,5) correctly', () => {
    const board = createBoard();
    const result = checkNoThree(board, 5, 5, SYM.MOON);
    expect(result.valid).toBe(true);
  });
});

describe('checkConstraints', () => {
  it('validates SAME constraint when symbols match', () => {
    const board = createBoard();
    board[0][1] = SYM.SUN;
    const constraints = [{ r1: 0, c1: 0, r2: 0, c2: 1, type: CONSTRAINT.SAME }];
    const result = checkConstraints(board, 0, 0, SYM.SUN, constraints);
    expect(result.valid).toBe(true);
  });

  it('rejects SAME constraint when symbols differ', () => {
    const board = createBoard();
    board[0][1] = SYM.SUN;
    const constraints = [{ r1: 0, c1: 0, r2: 0, c2: 1, type: CONSTRAINT.SAME }];
    const result = checkConstraints(board, 0, 0, SYM.MOON, constraints);
    expect(result.valid).toBe(false);
  });

  it('validates DIFF constraint when symbols differ', () => {
    const board = createBoard();
    board[0][1] = SYM.SUN;
    const constraints = [{ r1: 0, c1: 0, r2: 0, c2: 1, type: CONSTRAINT.DIFF }];
    const result = checkConstraints(board, 0, 0, SYM.MOON, constraints);
    expect(result.valid).toBe(true);
  });

  it('rejects DIFF constraint when symbols match', () => {
    const board = createBoard();
    board[0][1] = SYM.SUN;
    const constraints = [{ r1: 0, c1: 0, r2: 0, c2: 1, type: CONSTRAINT.DIFF }];
    const result = checkConstraints(board, 0, 0, SYM.SUN, constraints);
    expect(result.valid).toBe(false);
  });

  it('ignores constraints when partner is null', () => {
    const board = createBoard();
    const constraints = [{ r1: 0, c1: 0, r2: 0, c2: 1, type: CONSTRAINT.SAME }];
    const result = checkConstraints(board, 0, 0, SYM.SUN, constraints);
    expect(result.valid).toBe(true);
  });

  it('ignores constraints for unrelated cells', () => {
    const board = createBoard();
    board[2][2] = SYM.MOON;
    const constraints = [{ r1: 2, c1: 2, r2: 2, c2: 3, type: CONSTRAINT.SAME }];
    const result = checkConstraints(board, 0, 0, SYM.SUN, constraints);
    expect(result.valid).toBe(true);
  });

  it('handles vertical constraints', () => {
    const board = createBoard();
    board[1][0] = SYM.SUN;
    const constraints = [{ r1: 0, c1: 0, r2: 1, c2: 0, type: CONSTRAINT.DIFF }];
    const result = checkConstraints(board, 0, 0, SYM.MOON, constraints);
    expect(result.valid).toBe(true);
  });
});

describe('isValidPlacement (combined)', () => {
  it('returns valid for legal placement', () => {
    const board = createBoard();
    const result = isValidPlacement(board, 0, 0, SYM.SUN, []);
    expect(result.valid).toBe(true);
  });

  it('rejects out-of-bounds', () => {
    const board = createBoard();
    expect(isValidPlacement(board, -1, 0, SYM.SUN).valid).toBe(false);
    expect(isValidPlacement(board, 0, 6, SYM.SUN).valid).toBe(false);
  });

  it('rejects occupied cell', () => {
    const board = createBoard();
    board[0][0] = SYM.SUN;
    const result = isValidPlacement(board, 0, 0, SYM.MOON);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('occupied');
  });

  it('fails when balance rule violated', () => {
    const board = createBoard();
    board[0][0] = SYM.SUN;
    board[0][1] = SYM.SUN;
    board[0][2] = SYM.SUN;
    const result = isValidPlacement(board, 0, 3, SYM.SUN);
    expect(result.valid).toBe(false);
  });

  it('fails when three-in-a-row violated', () => {
    const board = createBoard();
    board[0][0] = SYM.SUN;
    board[0][1] = SYM.SUN;
    const result = isValidPlacement(board, 0, 2, SYM.SUN);
    expect(result.valid).toBe(false);
  });

  it('fails when constraint violated', () => {
    const board = createBoard();
    board[0][1] = SYM.SUN;
    const constraints = [{ r1: 0, c1: 0, r2: 0, c2: 1, type: CONSTRAINT.DIFF }];
    const result = isValidPlacement(board, 0, 0, SYM.SUN, constraints);
    expect(result.valid).toBe(false);
  });

  it('works with no constraints (default)', () => {
    const board = createBoard();
    const result = isValidPlacement(board, 0, 0, SYM.SUN);
    expect(result.valid).toBe(true);
  });
});

describe('checkWin', () => {
  it('returns true for valid complete board', () => {
    const board = makeValidBoard();
    expect(checkWin(board)).toBe(true);
  });

  it('returns false for incomplete board', () => {
    const board = makeValidBoard();
    board[3][3] = null;
    expect(checkWin(board)).toBe(false);
  });

  it('returns false for board with balance violation', () => {
    const board = makeValidBoard();
    // Swap to create imbalance
    board[0][0] = SYM.MOON; // now row 0 has 4 moons
    board[0][2] = SYM.SUN;
    expect(checkWin(board)).toBe(false);
  });

  it('returns false for board with three-in-a-row', () => {
    const board = makeValidBoard();
    // Force three suns in row 0
    board[0][0] = SYM.SUN;
    board[0][1] = SYM.SUN;
    board[0][2] = SYM.SUN;
    expect(checkWin(board)).toBe(false);
  });

  it('detects constraint violation', () => {
    const board = makeValidBoard();
    const constraints = [
      {
        r1: 0,
        c1: 0,
        r2: 0,
        c2: 1,
        type: board[0][0] === board[0][1] ? CONSTRAINT.DIFF : CONSTRAINT.SAME,
      },
    ];
    // This constraint is intentionally wrong for the board
    expect(checkWin(board, constraints)).toBe(false);
  });

  it('passes with correct constraints', () => {
    const board = makeValidBoard();
    const constraints = [
      {
        r1: 0,
        c1: 0,
        r2: 0,
        c2: 1,
        type: board[0][0] === board[0][1] ? CONSTRAINT.SAME : CONSTRAINT.DIFF,
      },
    ];
    expect(checkWin(board, constraints)).toBe(true);
  });
});
