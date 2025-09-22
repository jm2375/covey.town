import { createPlayerForTesting } from '../../TestUtils';
import {
  GAME_FULL_MESSAGE,
  GAME_NOT_IN_PROGRESS_MESSAGE,
  BOARD_POSITION_NOT_EMPTY_MESSAGE,
  MOVE_NOT_YOUR_TURN_MESSAGE,
  PLAYER_ALREADY_IN_GAME_MESSAGE,
  PLAYER_NOT_IN_GAME_MESSAGE,
} from '../../lib/InvalidParametersError';
import QuantumTicTacToeGame from './QuantumTicTacToeGame';
import Player from '../../lib/Player';
import { QuantumTicTacToeMove } from '../../types/CoveyTownSocket';

describe('QuantumTicTacToeGame', () => {
  let game: QuantumTicTacToeGame;
  let player1: Player;
  let player2: Player;
  let player3: Player;
  let moves: QuantumTicTacToeMove[] = [];

  beforeEach(() => {
    game = new QuantumTicTacToeGame();
    player1 = createPlayerForTesting();
    player2 = createPlayerForTesting();
    player3 = createPlayerForTesting();
    moves = [];
  });

  const makeMove = (player: Player, board: 'A' | 'B' | 'C', row: 0 | 1 | 2, col: 0 | 1 | 2) => {
    const gamePiece = game.state.x === player.id ? 'X' : 'O';
    game.applyMove({
      playerID: player.id,
      gameID: game.id,
      move: { board, row, col, gamePiece },
    });
  };

  function makeMoveAndCheckState(
    player: Player,
    board: 'A' | 'B' | 'C',
    row: 0 | 1 | 2,
    col: 0 | 1 | 2,
    expectedOutcome: 'WIN' | 'TIE' | undefined = undefined,
  ) {
    const gamePiece = player === player1 ? 'X' : 'O';
    makeMove(player, board, row, col);
    moves.push({ board, row, col, gamePiece });

    if (expectedOutcome === 'WIN') {
      expect(game.state.status).toEqual('OVER');
      expect(game.state.winner).toEqual(player.id);
    } else if (expectedOutcome === 'TIE') {
      expect(game.state.status).toEqual('OVER');
      expect(game.state.winner).toBeUndefined();
    } else {
      expect(game.state.status).toEqual('IN_PROGRESS');
      expect(game.state.winner).toBeUndefined();
    }
  }

  describe('_join', () => {
    it('should throw an error if the player is already in the game', () => {
      game.join(player1);
      expect(() => game.join(player1)).toThrowError(PLAYER_ALREADY_IN_GAME_MESSAGE);
      game.join(player2);
      expect(() => game.join(player2)).toThrowError(PLAYER_ALREADY_IN_GAME_MESSAGE);
    });

    it('should throw an error if the game is full', () => {
      game.join(player1);
      game.join(player2);

      expect(() => game.join(player3)).toThrowError(GAME_FULL_MESSAGE);
    });

    describe('When the player can be added', () => {
      it('makes the first player X and initializes the state with status WAITING_TO_START', () => {
        game.join(player1);
        expect(game.state.x).toEqual(player1.id);
        expect(game.state.o).toBeUndefined();
        expect(game.state.moves).toHaveLength(0);
        expect(game.state.status).toEqual('WAITING_TO_START');
        expect(game.state.winner).toBeUndefined();
        expect(game.state.xScore).toEqual(0);
        expect(game.state.oScore).toEqual(0);
      });

      describe('When the second player joins', () => {
        beforeEach(() => {
          game.join(player1);
          game.join(player2);
        });

        it('makes the second player O', () => {
          expect(game.state.x).toEqual(player1.id);
          expect(game.state.o).toEqual(player2.id);
        });

        it('sets the game status to IN_PROGRESS', () => {
          expect(game.state.status).toEqual('IN_PROGRESS');
          expect(game.state.winner).toBeUndefined();
          expect(game.state.moves).toHaveLength(0);
        });
      });
    });
  });

  describe('_leave', () => {
    it('should throw an error if the player is not in the game', () => {
      expect(() => game.leave(createPlayerForTesting())).toThrowError(PLAYER_NOT_IN_GAME_MESSAGE);
      const player = createPlayerForTesting();
      game.join(player);
      expect(() => game.leave(createPlayerForTesting())).toThrowError(PLAYER_NOT_IN_GAME_MESSAGE);
    });

    describe('when the player is in the game', () => {
      describe('when the game is in progress, it should set the game status to OVER and declare the other player the winner', () => {
        test('when X leaves', () => {
          game.join(player1);
          game.join(player2);
          expect(game.state.x).toEqual(player1.id);
          expect(game.state.o).toEqual(player2.id);

          game.leave(player1);

          expect(game.state.status).toEqual('OVER');
          expect(game.state.winner).toEqual(player2.id);
          expect(game.state.moves).toHaveLength(0);

          expect(game.state.x).toEqual(player1.id);
          expect(game.state.o).toEqual(player2.id);
        });

        test('when O leaves', () => {
          game.join(player1);
          game.join(player2);
          expect(game.state.x).toEqual(player1.id);
          expect(game.state.o).toEqual(player2.id);

          game.leave(player2);

          expect(game.state.status).toEqual('OVER');
          expect(game.state.winner).toEqual(player1.id);
          expect(game.state.moves).toHaveLength(0);

          expect(game.state.x).toEqual(player1.id);
          expect(game.state.o).toEqual(player2.id);
        });
      });

      describe('when one player is in the game', () => {
        describe('when the game is in progress, it should set the game status to OVER and declare the other player the winner', () => {
          test('when X leaves', () => {
            game.join(player1);
            game.join(player2);
            expect(game.state.x).toEqual(player1.id);
            expect(game.state.o).toEqual(player2.id);

            game.leave(player1);

            expect(game.state.status).toEqual('OVER');
            expect(game.state.winner).toEqual(player2.id);
            expect(game.state.moves).toHaveLength(0);

            expect(game.state.x).toEqual(player1.id);
            expect(game.state.o).toEqual(player2.id);
          });

          test('when O leaves', () => {
            game.join(player1);
            game.join(player2);
            expect(game.state.x).toEqual(player1.id);
            expect(game.state.o).toEqual(player2.id);

            game.leave(player2);

            expect(game.state.status).toEqual('OVER');
            expect(game.state.winner).toEqual(player1.id);
            expect(game.state.moves).toHaveLength(0);

            expect(game.state.x).toEqual(player1.id);
            expect(game.state.o).toEqual(player2.id);
          });
        });

        it('when the game is not in progress, it should set the game status to WAITING_TO_START and remove the player', () => {
          game.join(player1);
          expect(game.state.x).toEqual(player1.id);
          expect(game.state.o).toBeUndefined();
          expect(game.state.status).toEqual('WAITING_TO_START');
          expect(game.state.winner).toBeUndefined();
          game.leave(player1);
          expect(game.state.x).toBeUndefined();
          expect(game.state.o).toBeUndefined();
          expect(game.state.status).toEqual('WAITING_TO_START');
          expect(game.state.winner).toBeUndefined();
        });

        it('should allow the player to leave and rejoin', () => {
          game.join(player1);
          game.leave(player1);

          expect(game.state.x).toBeUndefined();
          expect(game.state.status).toBe('WAITING_TO_START');

          game.join(player1);

          expect(game.state.x).toBe(player1.id);
          expect(game.state.status).toBe('WAITING_TO_START');
        });
      });
    });
  });

  describe('applyMove', () => {
    describe('when given an invalid move', () => {
      it('should throw an error if the game is not in progress', () => {
        game.join(player1);
        expect(() => makeMove(player1, 'A', 0, 0)).toThrowError(GAME_NOT_IN_PROGRESS_MESSAGE);
      });

      describe('when the game is in progress', () => {
        beforeEach(() => {
          game.join(player1);
          game.join(player2);
          expect(game.state.status).toEqual('IN_PROGRESS');
        });

        it('should rely on the player ID to determine whose turn it is', () => {
          expect(() =>
            game.applyMove({
              gameID: game.id,
              playerID: player2.id,
              move: {
                board: 'A',
                row: 0,
                col: 0,
                gamePiece: 'X',
              },
            }),
          ).toThrowError(MOVE_NOT_YOUR_TURN_MESSAGE);
          expect(() =>
            game.applyMove({
              gameID: game.id,
              playerID: player1.id,
              move: {
                board: 'A',
                row: 0,
                col: 0,
                gamePiece: 'O',
              },
            }),
          ).not.toThrowError(MOVE_NOT_YOUR_TURN_MESSAGE);
        });

        it('should throw an error if the move is out of turn for the player ID', () => {
          expect(() =>
            game.applyMove({
              gameID: game.id,
              playerID: player2.id,
              move: {
                board: 'A',
                row: 0,
                col: 0,
                gamePiece: 'X',
              },
            }),
          ).toThrowError(MOVE_NOT_YOUR_TURN_MESSAGE);
          makeMove(player1, 'A', 0, 0);
          expect(() =>
            game.applyMove({
              gameID: game.id,
              playerID: player1.id,
              move: {
                board: 'B',
                row: 0,
                col: 1,
                gamePiece: 'X',
              },
            }),
          ).toThrowError(MOVE_NOT_YOUR_TURN_MESSAGE);
          makeMove(player2, 'B', 0, 2);
          expect(() =>
            game.applyMove({
              gameID: game.id,
              playerID: player2.id,
              move: {
                board: 'C',
                row: 2,
                col: 1,
                gamePiece: 'O',
              },
            }),
          ).toThrowError(MOVE_NOT_YOUR_TURN_MESSAGE);
        });

        it('should throw an error if the move is on an occupied space', () => {
          makeMove(player1, 'A', 0, 0);
          expect(() => {
            makeMove(player2, 'A', 0, 0);
          }).toThrowError(BOARD_POSITION_NOT_EMPTY_MESSAGE);
        });

        it('should handle a collision by losing the second players turn', () => {
          makeMove(player1, 'A', 1, 1);
          expect(game.state.moves).toHaveLength(1);

          expect(() => {
            makeMove(player2, 'A', 1, 1);
          }).toThrow(BOARD_POSITION_NOT_EMPTY_MESSAGE);

          expect(game.state.moves).toHaveLength(1);
        });

        it('should not change whose turn it is when an invalid move is made', () => {
          makeMove(player1, 'A', 0, 0);
          makeMove(player2, 'A', 0, 1);
          expect(() => {
            makeMove(player1, 'A', 0, 0);
          }).toThrowError(BOARD_POSITION_NOT_EMPTY_MESSAGE);
          expect(game.state.moves).toHaveLength(2);
          makeMove(player1, 'A', 0, 2);
          expect(game.state.moves).toHaveLength(3);
        });

        it('should not prevent the reuse of a space after an invalid move on it', () => {
          expect(() => {
            game.applyMove({
              gameID: game.id,
              playerID: player2.id,
              move: {
                board: 'A',
                row: 1,
                col: 1,
                gamePiece: 'O',
              },
            });
          }).toThrowError(MOVE_NOT_YOUR_TURN_MESSAGE);
          makeMove(player1, 'A', 1, 1);
        });

        it('should throw an error if a player tries to play on their own piece', () => {
          makeMove(player1, 'A', 0, 0);

          makeMove(player2, 'B', 0, 0);

          expect(() => {
            makeMove(player1, 'A', 0, 0);
          }).toThrow(BOARD_POSITION_NOT_EMPTY_MESSAGE);
        });
      });
    });

    describe('publicly visible squares', () => {
      beforeEach(() => {
        game.join(player1);
        game.join(player2);
      });

      it('should make a square publicly visible on collision', () => {
        makeMove(player1, 'A', 1, 1);

        expect(game.state.publiclyVisible.A[1][1]).toBe(false);

        expect(() => {
          makeMove(player2, 'A', 1, 1);
        }).toThrow(BOARD_POSITION_NOT_EMPTY_MESSAGE);

        expect(game.state.publiclyVisible.A[1][1]).toBe(true);
      });
    });

    describe('when given a valid move', () => {
      beforeEach(() => {
        moves = [];
        game.join(player1);
        game.join(player2);
        expect(game.state.status).toEqual('IN_PROGRESS');
      });

      it('should add the move to the game state', () => {
        makeMove(player1, 'A', 1, 2);
        expect(game.state.moves).toHaveLength(1);
        expect(game.state.moves[0]).toEqual({ board: 'A', row: 1, col: 2, gamePiece: 'X' });
      });

      it('should not end the game if the move does not end the game', () => {
        makeMove(player1, 'A', 1, 2);
        makeMove(player2, 'B', 1, 0);
        makeMove(player1, 'A', 0, 2);
        makeMove(player2, 'B', 2, 2);
        makeMove(player1, 'A', 1, 1);
        makeMove(player2, 'B', 2, 0);
        expect(game.state.status).toEqual('IN_PROGRESS');
      });

      it('should award a point when a player gets three-in-a-row', () => {
        makeMove(player1, 'A', 0, 0); // X
        makeMove(player2, 'B', 0, 0); // O
        makeMove(player1, 'A', 0, 1); // X
        makeMove(player2, 'B', 0, 1); // O
        makeMove(player1, 'A', 0, 2); // X wins board A

        expect(game.state.xScore).toBe(1);
        expect(game.state.oScore).toBe(0);
        expect(game.state.status).toBe('IN_PROGRESS');
      });

      it('should not allow moves on a board that has been won', () => {
        makeMove(player1, 'A', 0, 0); // X
        makeMove(player2, 'B', 0, 0); // O
        makeMove(player1, 'A', 0, 1); // X
        makeMove(player2, 'B', 0, 1); // O
        makeMove(player1, 'A', 0, 2); // X wins board A

        expect(game.state.xScore).toBe(1);
        expect(game.state.oScore).toBe(0);

        expect(() => {
          makeMove(player2, 'A', 1, 1);
        }).toThrow(GAME_NOT_IN_PROGRESS_MESSAGE);
      });

      it('should not end the game if only one board is over', () => {
        makeMove(player1, 'A', 0, 0); // X
        makeMove(player2, 'B', 0, 0); // O
        makeMove(player1, 'A', 0, 1); // X
        makeMove(player2, 'B', 0, 1); // O
        makeMove(player1, 'A', 0, 2); // X wins board A

        expect(game.state.xScore).toBe(1);
        expect(game.state.status).toBe('IN_PROGRESS');

        makeMove(player2, 'C', 1, 1); // O

        expect(game.state.status).toBe('IN_PROGRESS');
      });
    });

    describe('scoring and game end', () => {
      beforeEach(() => {
        game.join(player1);
        game.join(player2);
      });

      it('declares a tie on individual board if there are no winning conditions but the board is full', () => {
        makeMove(player1, 'A', 0, 0); // X
        makeMove(player2, 'B', 0, 1); // O
        makeMove(player1, 'A', 0, 2); // X
        makeMove(player2, 'B', 2, 0); // O
        makeMove(player1, 'A', 1, 1); // X
        makeMove(player2, 'B', 1, 2); // O
        makeMove(player1, 'A', 1, 0); // X
        makeMove(player2, 'B', 2, 2); // O
        makeMove(player1, 'A', 2, 1); // X ties board A

        expect(game.state.status).toBe('IN_PROGRESS');
      });

      it('declares X winner when X has higher score and all boards complete', () => {
        makeMove(player1, 'A', 0, 0); // X
        makeMove(player2, 'B', 0, 0); // 0
        makeMove(player1, 'A', 0, 1); // X
        makeMove(player2, 'B', 0, 1); // 0
        makeMove(player1, 'A', 0, 2); // X wins board A
        makeMove(player2, 'B', 0, 2); // O wins board B
        makeMove(player1, 'C', 0, 0); // X
        makeMove(player2, 'C', 1, 0); // 0
        makeMove(player1, 'C', 0, 1); // X
        makeMove(player2, 'C', 1, 1); // 0

        makeMoveAndCheckState(player1, 'C', 0, 2, 'WIN'); // X wins board C and the game

        expect(game.state.xScore).toBe(2);
        expect(game.state.oScore).toBe(1);
      });

      it('declares O winner when O has higher score and all boards complete', () => {
        makeMove(player1, 'A', 0, 0); // X
        makeMove(player2, 'B', 0, 0); // O
        makeMove(player1, 'A', 0, 1); // X
        makeMove(player2, 'B', 0, 1); // O
        makeMove(player1, 'A', 0, 2); // X wins board A
        makeMove(player2, 'B', 0, 2); // O wins board B
        makeMove(player1, 'C', 0, 0); // X
        makeMove(player2, 'C', 1, 0); // O
        makeMove(player1, 'C', 0, 1); // X
        makeMove(player2, 'C', 1, 1); // O
        makeMove(player1, 'C', 2, 2); // X

        makeMoveAndCheckState(player2, 'C', 1, 2, 'WIN'); // O wins board C and the game

        expect(game.state.xScore).toBe(1);
        expect(game.state.oScore).toBe(2);
      });

      it('declares a tie when scores are equal and all boards complete', () => {
        makeMove(player1, 'A', 0, 0); // X
        makeMove(player2, 'B', 0, 0); // O
        makeMove(player1, 'A', 0, 1); // X
        makeMove(player2, 'B', 0, 1); // O
        makeMove(player1, 'A', 0, 2); // X wins A
        makeMove(player2, 'B', 0, 2); // O wins B
        makeMove(player1, 'C', 0, 2); // X
        makeMove(player2, 'C', 0, 0); // O
        makeMove(player1, 'C', 1, 0); // X
        makeMove(player2, 'C', 0, 1); // O
        makeMove(player1, 'C', 1, 1); // X
        makeMove(player2, 'C', 1, 2); // O
        makeMove(player1, 'C', 2, 1); // X
        makeMove(player2, 'C', 2, 0); // O

        makeMoveAndCheckState(player1, 'C', 2, 2, 'TIE'); // X ties board C ties and the game

        expect(game.state.xScore).toBe(1);
        expect(game.state.oScore).toBe(1);
      });
    });

    describe('a full game from start to finish', () => {
      beforeEach(() => {
        game.join(player1);
        game.join(player2);
      });

      it('should correctly handle a full game, including collisions, scoring, and a final winner', () => {
        makeMove(player1, 'A', 0, 0); // X
        makeMove(player2, 'B', 0, 0); // O
        makeMove(player1, 'A', 0, 1); // X
        makeMove(player2, 'B', 0, 1); // O
        makeMove(player1, 'A', 0, 2); // X wins board A

        expect(game.state.xScore).toBe(1);
        expect(game.state.oScore).toBe(0);
        expect(game.state.status).toBe('IN_PROGRESS');

        makeMove(player2, 'B', 0, 2); // O wins board B

        expect(game.state.xScore).toBe(1);
        expect(game.state.oScore).toBe(1);
        expect(game.state.status).toBe('IN_PROGRESS');

        makeMove(player1, 'C', 1, 1); // X

        expect(() => {
          makeMove(player2, 'C', 1, 1); // O collides with X and reveals
        }).toThrow(BOARD_POSITION_NOT_EMPTY_MESSAGE);
        expect(game.state.publiclyVisible.C[1][1]).toBe(true);

        makeMove(player1, 'C', 0, 0); // X
        makeMove(player2, 'C', 2, 0); // O
        makeMove(player1, 'C', 2, 2); // X wins board C

        expect(game.state.xScore).toBe(2);
        expect(game.state.oScore).toBe(1);
        expect(game.state.status).toBe('OVER');
        expect(game.state.winner).toBe(player1.id);
      });
    });
  });
});
