import {
  GameMove,
  QuantumTicTacToeGameState,
  QuantumTicTacToeMove,
  TicTacToeGridPosition,
} from '../../types/CoveyTownSocket';
import Game from './Game';
import TicTacToeGame from './TicTacToeGame';
import Player from '../../lib/Player';
import InvalidParametersError, {
  BOARD_POSITION_NOT_EMPTY_MESSAGE,
  GAME_FULL_MESSAGE,
  GAME_NOT_IN_PROGRESS_MESSAGE,
  MOVE_NOT_YOUR_TURN_MESSAGE,
  PLAYER_ALREADY_IN_GAME_MESSAGE,
  PLAYER_NOT_IN_GAME_MESSAGE,
} from '../../lib/InvalidParametersError';

/**
 * A QuantumTicTacToeGame is a Game that implements the rules of the Tic-Tac-Toe variant described at https://www.smbc-comics.com/comic/tic.
 * This class acts as a controller for three underlying TicTacToeGame instances, orchestrating the "quantum" rules by taking
 * the role of the monitor.
 */
export default class QuantumTicTacToeGame extends Game<
  QuantumTicTacToeGameState,
  QuantumTicTacToeMove
> {
  private _games: { A: TicTacToeGame; B: TicTacToeGame; C: TicTacToeGame };

  private _xScore: number;

  private _oScore: number;

  private _moveCount: number;

  public constructor() {
    super({
      moves: [],
      status: 'WAITING_TO_START',
      xScore: 0,
      oScore: 0,
      publiclyVisible: {
        A: [
          [false, false, false],
          [false, false, false],
          [false, false, false],
        ],
        B: [
          [false, false, false],
          [false, false, false],
          [false, false, false],
        ],
        C: [
          [false, false, false],
          [false, false, false],
          [false, false, false],
        ],
      },
    });

    this._games = {
      A: new TicTacToeGame(),
      B: new TicTacToeGame(),
      C: new TicTacToeGame(),
    };

    this._xScore = 0;
    this._oScore = 0;
    this._moveCount = 0;
  }

  protected _join(player: Player): void {
    // Quantum level player presence check
    if (this.state.x === player.id || this.state.o === player.id) {
      throw new InvalidParametersError(PLAYER_ALREADY_IN_GAME_MESSAGE);
    }
    if (this.state.x && this.state.o) {
      throw new InvalidParametersError(GAME_FULL_MESSAGE);
    }

    // Sub level player join attempt for each board
    Object.values(this._games).forEach(game => {
      game.join(player);
    });

    // Set Quantum level states to reflect successful subjoins
    if (!this.state.x) {
      this.state = {
        ...this.state,
        x: player.id,
      };
    } else if (!this.state.o) {
      this.state = {
        ...this.state,
        o: player.id,
      };
    }

    // Set Quantum status to reflect successful start
    if (this.state.x && this.state.o) {
      this.state = {
        ...this.state,
        status: 'IN_PROGRESS',
      };
    }
  }

  protected _leave(player: Player): void {
    if (this.state.x !== player.id && this.state.o !== player.id) {
      throw new InvalidParametersError(PLAYER_NOT_IN_GAME_MESSAGE);
    }

    // Sub level player leave attempt for each board
    Object.values(this._games).forEach(game => {
      game.leave(player);
    });

    if (this.state.o === undefined) {
      this.state = {
        moves: [],
        status: 'WAITING_TO_START',
        xScore: 0,
        oScore: 0,
        publiclyVisible: {
          A: [
            [false, false, false],
            [false, false, false],
            [false, false, false],
          ],
          B: [
            [false, false, false],
            [false, false, false],
            [false, false, false],
          ],
          C: [
            [false, false, false],
            [false, false, false],
            [false, false, false],
          ],
        },
      };
      return;
    }
    if (this.state.x === player.id) {
      this._checkForWins();
      this.state = {
        ...this.state,
        status: 'OVER',
        winner: this.state.o,
      };
    } else {
      this._checkForWins();
      this.state = {
        ...this.state,
        status: 'OVER',
        winner: this.state.x,
      };
    }
  }

  public applyMove(move: GameMove<QuantumTicTacToeMove>): void {
    // Check if game is in progress at quantum level
    if (this.state.status !== 'IN_PROGRESS') {
      throw new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE);
    }

    const subGameBoard = this._games[move.move.board];

    // Validate playable board
    if (subGameBoard.state.status === 'OVER') {
      throw new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE);
    }

    // Validate turn order at quantum level
    const isXTurn = this._moveCount % 2 === 0;
    const playerIsX = move.playerID === this.state.x;
    
    if ((isXTurn && !playerIsX) || (!isXTurn && playerIsX)) {
      throw new InvalidParametersError(MOVE_NOT_YOUR_TURN_MESSAGE);
    }

    const gamePiece: 'X' | 'O' = move.playerID === this.state.x ? 'X' : 'O';

    // Data expected by applyMove
    const subGameCompleteInfo = {
      gameID: subGameBoard.id,
      playerID: move.playerID,
      move: {
        gamePiece,
        row: move.move.row,
        col: move.move.col,
      },
    };

    const dummySubGameMove = {
      gamePiece: '' as 'X' | 'O' | '',
      row: 2 as TicTacToeGridPosition,
      col: 2 as TicTacToeGridPosition,
    };

    try {
      subGameBoard.applyMove(subGameCompleteInfo);

      const quantumGameMove = {
        board: move.move.board,
        gamePiece,
        row: move.move.row,
        col: move.move.col,
      };

      this.state = {
        ...this.state,
        moves: [...this.state.moves, quantumGameMove],
      };

      this._moveCount++;

      // Add in dummy move from valid player to sync turn order
      Object.values(this._games).forEach(game => {
        if (game.state.moves.length !== this._moveCount) {
          game.state.moves = [...game.state.moves, dummySubGameMove];
        }
      });
    } catch (error) {
      if (
        error instanceof InvalidParametersError &&
        error.message === BOARD_POSITION_NOT_EMPTY_MESSAGE
      ) {
        const subGameBoardState = subGameBoard._board;
        const existingPiece = subGameBoardState[move.move.row][move.move.col];

        if (existingPiece === gamePiece) {
          throw new InvalidParametersError(BOARD_POSITION_NOT_EMPTY_MESSAGE);
        }

        if (existingPiece !== gamePiece && existingPiece !== '') {
          const updatedPubliclyVisible = { ...this.state.publiclyVisible };
          updatedPubliclyVisible[move.move.board][move.move.row][move.move.col] = true;

          this.state = {
            ...this.state,
            publiclyVisible: updatedPubliclyVisible,
          };

          this._moveCount++;

          // Add in dummy move from valid player to sync turn order
          Object.values(this._games).forEach(game => {
            if (game.state.moves.length !== this._moveCount) {
              game.state.moves = [...game.state.moves, dummySubGameMove];
            }
          });
        }
      }

      // Throw Sub level errors at Quantum level
      throw error;
    }

    this._checkForWins();
    this._checkForGameEnding();
  }

  /**
   * Checks all three sub-games for any new three-in-a-row conditions.
   * Awards points and marks boards as "won" so they can't be played on.
   */
  private _checkForWins(): void {
    let xPlayerScoreTotal = 0;
    let oPlayerScoreTotal = 0;

    Object.entries(this._games).forEach(([_, game]) => {
      if (game.state.winner === this.state.x) {
        xPlayerScoreTotal++;
      }
      if (game.state.winner === this.state.o) {
        oPlayerScoreTotal++;
      }
    });

    this._xScore = xPlayerScoreTotal;
    this._oScore = oPlayerScoreTotal;

    this.state = {
      ...this.state,
      xScore: this._xScore,
      oScore: this._oScore,
    };
  }

  /**
   * A Quantum Tic-Tac-Toe game ends when no more moves are possible.
   * This happens when all squares on all boards are either occupied or part of a won board.
   */
  private _checkForGameEnding(): void {
    const allSubGamesOver = Object.values(this._games).every(game => game.state.status === 'OVER');

    if (allSubGamesOver) {
      let winner: string | undefined;

      if (this._xScore > this._oScore) {
        winner = this.state.x;
      } else if (this._oScore > this._xScore) {
        winner = this.state.o;
      }

      this.state = {
        ...this.state,
        status: 'OVER',
        winner,
        xScore: this._xScore,
        oScore: this._oScore,
      };
    }
  }
}
