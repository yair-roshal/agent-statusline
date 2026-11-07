'use strict';
// Quote sets for the `quote` segment. One quote per day, same for the whole day.
// Pick a set with options.quotes = 'avot' | 'dev' | 'stoic', or point
// options.quotesFile to a JSON file: [["text", "author"], ...].

const avot = [
  ['The world stands on three things: on Torah, on service, and on acts of kindness.', 'Shimon the Righteous, 1:2'],
  ['Make for yourself a teacher, acquire for yourself a friend, and judge every person favorably.', 'Yehoshua ben Perachya, 1:6'],
  ['Love work and hate lordship.', 'Shemaya, 1:10'],
  ['Love peace and pursue peace, love people and bring them near to Torah.', 'Hillel, 1:12'],
  ['If I am not for myself, who will be for me? If I am only for myself, what am I? And if not now, when?', 'Hillel, 1:14'],
  ['Say little and do much, and greet every person with a cheerful face.', 'Shammai, 1:15'],
  ['Not study is the main thing, but deed.', 'Shimon son of Rabban Gamliel, 1:17'],
  ['The world endures on three things: on justice, on truth, and on peace.', 'Rabban Shimon ben Gamliel, 1:18'],
  ['Do not judge your fellow until you have stood in his place.', 'Hillel, 2:4'],
  ['Do not say "When I have free time I will study" — perhaps you will never have free time.', 'Hillel, 2:4'],
  ['In a place where there are no men, strive to be a man.', 'Hillel, 2:5'],
  ["Let your fellow's honor be as dear to you as your own.", 'Rabbi Eliezer, 2:10'],
  ['The day is short, and the work is much.', 'Rabbi Tarfon, 2:15'],
  ['It is not upon you to finish the work, but neither are you free to desist from it.', 'Rabbi Tarfon, 2:16'],
  ['Know where you came from, where you are going, and before Whom you will give an accounting.', 'Akavya ben Mahalalel, 3:1'],
  ['All is foreseen, yet freedom of choice is given.', 'Rabbi Akiva, 3:15'],
  ['Who is wise? One who learns from every person.', 'Ben Zoma, 4:1'],
  ['Who is strong? One who conquers his inclination.', 'Ben Zoma, 4:1'],
  ['Who is rich? One who is happy with his portion.', 'Ben Zoma, 4:1'],
  ['Who is honored? One who honors others.', 'Ben Zoma, 4:1'],
  ['There is no person without his hour, and no thing without its place.', 'Ben Azzai, 4:3'],
  ['Be first to greet every person.', 'Rabbi Matya ben Charash, 4:15'],
  ['Do not look at the jug, but at what is in it.', 'Rabbi Meir, 4:20'],
  ['Be bold as a leopard, light as an eagle, swift as a deer, and strong as a lion.', 'Yehuda ben Tema, 5:20'],
  ['Turn it and turn it, for everything is in it.', 'Ben Bag Bag, 5:22'],
  ['According to the effort is the reward.', 'Ben Hei Hei, 5:23'],
];

const dev = [
  ['Make it work, make it right, make it fast.', 'Kent Beck'],
  ['Simplicity is prerequisite for reliability.', 'Edsger W. Dijkstra'],
  ['Premature optimization is the root of all evil.', 'Donald Knuth'],
  ['Programs must be written for people to read, and only incidentally for machines to execute.', 'Harold Abelson'],
  ['The best code is no code at all.', 'Jeff Atwood'],
  ['Any fool can write code that a computer can understand. Good programmers write code that humans can understand.', 'Martin Fowler'],
  ['Debugging is twice as hard as writing the code in the first place.', 'Brian Kernighan'],
  ['First, solve the problem. Then, write the code.', 'John Johnson'],
  ['Deleted code is debugged code.', 'Jeff Sickel'],
  ['Talk is cheap. Show me the code.', 'Linus Torvalds'],
  ['There are only two hard things in computer science: cache invalidation and naming things.', 'Phil Karlton'],
  ['Weeks of coding can save you hours of planning.', 'Unknown'],
];

const stoic = [
  ['You have power over your mind — not outside events. Realize this, and you will find strength.', 'Marcus Aurelius'],
  ['We suffer more often in imagination than in reality.', 'Seneca'],
  ['It is not that we have a short time to live, but that we waste a lot of it.', 'Seneca'],
  ['First say to yourself what you would be; and then do what you have to do.', 'Epictetus'],
  ['The impediment to action advances action. What stands in the way becomes the way.', 'Marcus Aurelius'],
  ['Waste no more time arguing about what a good man should be. Be one.', 'Marcus Aurelius'],
  ['No man is free who is not master of himself.', 'Epictetus'],
  ['Luck is what happens when preparation meets opportunity.', 'Seneca'],
];

module.exports = { avot, dev, stoic };
