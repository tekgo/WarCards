
const cardValues = {
	joker	: 0,
	ace		: 1,
	two		: 2,
	three	: 3,
	four	: 4,
	five	: 5,
	six		: 6,
	seven	: 7,
	eight	: 8,
	nine	: 9,
	ten		: 10,
	jack	: 11,
	queen	: 12,
	king	: 13,
}

const acesBeatKings = true;
const shuffleWinnersPile = true;
const lastCardPlayedFaceUp = true;
const aceBeatsAll = false;
const doSwap = true;

/**
 * Shuffles array in place. ES6 version
 * @param {Array} a items An array containing the items.
 */
function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

class Card {
	constructor(value, suit) {
		this.value = value;
		this.suit = suit;
	}

	compare(otherCard, aceBeatsKing = true) {
		if (otherCard.value == this.value) {
			return 0;
		}
		if (aceBeatsAll) {
			if (otherCard.value == cardValues.ace) {
				return 1;
			}
			if (this.value == cardValues.ace) {
				return -1;
			}
		}
		if (aceBeatsKing) {
			if (this.value == cardValues.king && otherCard.value == cardValues.ace) {
				return 1;
			}

			if (this.value == cardValues.ace && otherCard.value == cardValues.king) {
				return -1;
			}
		}

		return otherCard.value - this.value;
	}
}

class PlayerDeck {
	constructor(cards, stats = null, name = "unknown") {
		this.cards = cards;
		this.stats = stats || PlayerDeck.baseStats();
		this.name = name;
	}

	hasCards() {
		return this.cards.length > 0;
	}

	playCard() {
		if (this.cards.length == 0) {
			return null;
		}
		const card = this.cards.shift()
		return card;
	}

	addCards(newCards) {
		this.cards = this.cards.concat(newCards);
	}

	static baseStats() {
		return {strength : 0, agility: 0, stamina: 0, intelligence: 0};
	}

	giveBestCard(intDiff) {
		if (this.cards.length == 0) {
			return [];
		}

		const start = Math.floor(13 - intDiff);
		for (let i = start; i > 0; i--) {
			const index = this.indexOfCard(i);
			if (index != -1) {
				const cards = this.cards.splice(index,1);
				return cards;
			}
		}

		return [];
	}

	giveWorstCard() {
		if (this.cards.length == 0) {
			return [];
		}

		for (let i = 2; i < 14; i++) {
			const index = this.indexOfCard(i);
			if (index != -1) {
				const cards = this.cards.splice(index,1);
				return cards;
			}
		}

		return [];
	}

	giveAce() {
		if (this.cards.length == 0) {
			return [];
		}

		const index = this.indexOfCard(cardValues.ace);
		if (index != -1) {
			const cards = this.cards.splice(index,1);
			return cards;
		}

		return [];
	}

	indexOfCard(cardValue) {
		for (var i = 0; i < this.cards.length; i++) {
			if(this.cards[i].value == cardValue) {
				return i
			}
		}
		return -1;
	}
}

class WarMachine {

	constructor(cards, players) {
		shuffle(cards);

		for (let i = 0; i < cards.length; i++) {
			const card = cards[i];
			players[i % players.length].addCards([card]);
		}

		this.players = players;
		if (doSwap) {
			this.swapCards();
		}
	}

	static makeMachine(cards, numberOfPlayers = 2) {
		let players = [];
		for (let i = 0; i < numberOfPlayers; i++) {
			players.push(new PlayerDeck([]));
		}

		return new WarMachine(cards, players);
	}

	swapCards() {
		for (let i = 0; i < this.players.length - 1; i++) {
			const firstPlayer = this.players[i];
			for (let j = 1; j < this.players.length; j++) {
				const secondPlayer = this.players[j];

				// Stronger players can steal higher value cards from their opponents.
				let strengthDiff = firstPlayer.stats.strength - secondPlayer.stats.strength;
				if (strengthDiff != 0) {
					const strongerPlayer = strengthDiff > 0 ? firstPlayer : secondPlayer;
					const weakerPlayer = strengthDiff > 0 ? secondPlayer : firstPlayer;
					let intDiff = Math.max(weakerPlayer.stats.intelligence - strongerPlayer.stats.intelligence, 0);
					strengthDiff = Math.abs(strengthDiff);
					while(strengthDiff > 0) {
						const strongCards = weakerPlayer.giveBestCard(intDiff);
						const weakCards = strongerPlayer.giveWorstCard();
						strengthDiff--;
						strongerPlayer.addCards(strongCards);
						weakerPlayer.addCards(weakCards);
					}
				}

				// Faster players can steal aces from their opponents.
				let agilityDiff = firstPlayer.stats.agility - secondPlayer.stats.agility;
				if (agilityDiff != 0) {
					const fasterPlayer = agilityDiff > 0 ? firstPlayer : secondPlayer;
					const slowerPlayer = agilityDiff > 0 ? secondPlayer : firstPlayer;
					agilityDiff = Math.abs(agilityDiff);
					while(agilityDiff > 0) {
						const ace = slowerPlayer.giveAce();
						if (ace) {
							const slowCards = fasterPlayer.giveWorstCard();
							fasterPlayer.addCards(ace);
							slowerPlayer.addCards(slowCards);
						}
						agilityDiff--;
					}
				}

			}
		}
	}

	playRound() {
		let pile = [];
		const jokerCard = new Card(cardValues.joker, 0); // Jokercard is a placeholder for a non-card.
		let currentCards = Array(this.players.length).fill(jokerCard);

		// Everybody play a card!
		for (let i = 0; i < this.players.length; i++) {
			const player = this.players[i];
			const playerCard = player.playCard() || jokerCard;
			currentCards[i] = playerCard;
			pile.push(playerCard);
		}

		printCards(currentCards);
		let winner = WarMachine.determineWinner(currentCards);

		while(winner == -1) { //WAR
			bufferText("WAR");
			currentCards = Array(this.players.length).fill(jokerCard);

			for (let i = 0; i < this.players.length; i++) {
				const player = this.players[i];
				let playerCard = player.playCard() || jokerCard;
				currentCards[i] = playerCard;
				pile.push(playerCard);
				playerCard = player.playCard();

				// If the player doesn't have a card and lastCardPlayedFaceUp is false, use a joker as a placeholder
				if (!lastCardPlayedFaceUp) {
					playerCard = playerCard || jokerCard;
				}

				if (playerCard || !lastCardPlayedFaceUp) {
					currentCards[i] = playerCard;
					pile.push(playerCard);
				}
			}

			printCards(currentCards);
			winner = WarMachine.determineWinner(currentCards);
			if (winner == -1 && (this.players.filter(player => player.hasCards()).length == 0)) {
				winner = 0;
				bufferText("BAD GAME");
			}
		}

		pile = pile.filter(card => card != jokerCard);

		if (shuffleWinnersPile) {
			shuffle(pile);
		}

		this.players[winner].addCards(pile);
	}

	isPlaying() {
		let validPlayers = this.players.filter(player => player.hasCards())
		if (validPlayers.length < 2) {
			return false;
		}
		return true;
	}

	static determineWinner(cards) {
		let associatedCards = cards.map((card, index) => {return {index : index, card : card} });
		associatedCards = associatedCards.sort( (a,b) => {
			return a.card.compare(b.card, acesBeatKings);
		});

		const winningValue = associatedCards[0].card.value;
		const winners = associatedCards.filter( aCard => aCard.card.value == winningValue);
		if (winners.length == 1) {
			return winners[0].index;
		}  
		return -1;
	}
}

let buffer = "";

function bufferText(text) {
	buffer += text + "\n";
}

function printBuffer() {
	console.log(buffer);
	buffer = "";
}

function printCards(cards) {
	const printOuts = cards.map(card => card.value);
	bufferText(printOuts.join("\t"));
}

function makeDeck() {
	let deck = [];
	for (var i = 0; i < 52; i++) {
		const value = (i % 13) + 1;
		const suit = Math.floor(i / 13);
		deck.push(new Card(value, suit));
	}
	return deck;
}

function playGame(deck, players) {
	let warPlayer = new WarMachine(deck, players);
	let roundCount = 0
	while(warPlayer.isPlaying() && roundCount < 10000) {
		warPlayer.playRound();
		roundCount++;
	}

	let livingPlayers = warPlayer.players.filter(player => player.hasCards());
	let names = livingPlayers.map( player => player.name);
	return names;
}

let twoCard = new Card(cardValues.two, 0);
let aceCard = new Card(cardValues.ace, 0);
let kingCard = new Card(cardValues.king, 0);

console.log(WarMachine.determineWinner([twoCard, kingCard]) == 1); // expect 1
console.log(WarMachine.determineWinner([aceCard, kingCard]) == 0); // expect 0
console.log(WarMachine.determineWinner([twoCard, aceCard]) == 0); // expect 0

// Strength - Can steal high cards.
// Agility - Can steal aces.
// Stamina - ?
// intelligence - Limits the face cards strong characters can steal.

let warriorStats = {strength : 2, agility: 1, stamina: 0, intelligence: 0};
let wizardStats = {strength : 0, agility: 2, stamina: 0, intelligence: 3};
let thiefStats = {strength : 0, agility: 3, stamina: 0, intelligence: 1};

let stats = {};

for (var i = 0; i < 1000; i++) {
	let warrior = new PlayerDeck([],warriorStats, "Warrior");
	let wizard = new PlayerDeck([],wizardStats, "Wizard");
	let thief = new PlayerDeck([],thiefStats, "Thief");
	let names = playGame(makeDeck(), [warrior, wizard]);

	names.forEach (name => {
		stats[name] = (stats[name] || 0) + 1;
	})
}

console.log(stats);

