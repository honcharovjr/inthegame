-- Starting catalog: 34 games, including classic games that need no box.
-- Catalog games have no author (created_by is null) and are visible to everyone
-- who is signed in. They are managed here, in migrations, by the maintainer.

insert into public.games
  (name, description, type, is_classic, min_players, max_players, typical_duration_min)
values
  -- Classic, no box needed
  ('Chess', 'Two players move sixteen pieces each and try to trap the opposing king.', 'board', true, 2, 2, 60),
  ('Checkers', 'Jump over the opponent''s pieces on a diagonal board to capture them all.', 'board', true, 2, 2, 30),
  ('Backgammon', 'Race all your checkers home, using dice to move.', 'board', true, 2, 2, 30),
  ('Go', 'Surround more territory than your opponent with black and white stones.', 'board', true, 2, 2, 60),
  ('Dominoes', 'Match the ends of tiles and be the first to play your last one.', 'dominoes', true, 2, 4, 30),
  ('Mahjong', 'Collect sets of tiles to complete a winning hand.', 'dominoes', true, 4, 4, 90),
  ('Poker', 'Bet on the strength of your hand and bluff the table.', 'card', true, 2, 9, 90),
  ('Blackjack', 'Get closer to 21 than the dealer without going over.', 'card', true, 2, 7, 20),
  ('Durak', 'Defend against attacks and get rid of your cards. The last player holding cards loses.', 'card', true, 2, 6, 20),
  ('Hearts', 'Avoid taking hearts and the queen of spades, or take them all.', 'card', true, 3, 4, 45),
  ('Bridge', 'Two pairs bid for contracts and take tricks.', 'card', true, 4, 4, 60),
  ('Rummy', 'Form sets and runs and be the first to empty your hand.', 'card', true, 2, 6, 40),
  ('Spades', 'Partners bid on tricks and try to make exactly what they bid.', 'card', true, 4, 4, 45),
  ('Crazy Eights', 'Match the suit or number of the top card and shed your hand.', 'card', true, 2, 7, 20),
  ('Go Fish', 'Ask for cards to collect sets of four.', 'card', true, 2, 6, 15),
  ('Solitaire', 'Sort a shuffled deck into ordered stacks, alone.', 'card', true, 1, 1, 15),
  ('Farkle', 'Roll six dice, set aside scoring dice and push your luck.', 'dice', true, 2, 8, 30),
  ('Liar''s Dice', 'Bid on the dice hidden under all the cups, and call bluffs.', 'dice', true, 2, 6, 30),
  ('Bunco', 'Roll for the round''s number across tables and score the most.', 'dice', true, 4, 12, 60),
  -- Boxed games
  ('Catan', 'Collect resources, trade and build settlements on an island.', 'board', false, 3, 4, 90),
  ('Carcassonne', 'Place tiles to build a medieval landscape and claim it with followers.', 'board', false, 2, 5, 45),
  ('Ticket to Ride', 'Collect train cards and claim railway routes across a map.', 'board', false, 2, 5, 60),
  ('Pandemic', 'Work together as a team to stop four diseases spreading.', 'board', false, 2, 4, 45),
  ('Monopoly', 'Buy properties, collect rent and bankrupt your opponents.', 'board', false, 2, 8, 120),
  ('Scrabble', 'Build crossing words from letter tiles on a board.', 'board', false, 2, 4, 90),
  ('Risk', 'Raise armies and conquer territories across the world map.', 'board', false, 2, 6, 120),
  ('Clue', 'Work out who committed the crime, with what and where.', 'board', false, 3, 6, 45),
  ('Yahtzee', 'Roll five dice up to three times to fill scoring combinations.', 'dice', false, 1, 6, 30),
  ('Uno', 'Match colour or number and be the first to empty your hand.', 'card', false, 2, 10, 30),
  ('Exploding Kittens', 'Draw cards and avoid the exploding kitten.', 'card', false, 2, 5, 15),
  ('Codenames', 'Two teams guess their words from one-word clues.', 'party', false, 4, 8, 15),
  ('Dixit', 'Tell stories about pictures and guess which card belongs to the storyteller.', 'party', false, 3, 8, 30),
  ('Jenga', 'Pull blocks from a tower without making it fall.', 'party', false, 2, 8, 15),
  ('Taboo', 'Make your team guess a word without using the forbidden ones.', 'party', false, 4, 10, 30);
