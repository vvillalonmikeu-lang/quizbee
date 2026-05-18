# DICT Quiz Bee

This website is a quiz system with two main pages:

- The main quiz page for hosting and presenting questions to contestants
- The admin page for adding new quiz questions

## Main Quiz Page

Open the homepage of the website to start the quiz.

### How To Use

1. Open the main website.
2. Choose a level:
	- ELEMENTARY
	- JUNIOR HIGH
	- SENIOR HIGH
3. Click `START QUIZ`.
4. The quiz will begin with the first round.

### Quiz Flow

- The quiz uses four rounds:
  - EASY
  - INTERMEDIATE
  - HARD
  - CLINCHER
- EASY, INTERMEDIATE, and HARD rounds display up to 5 randomized questions.
- The CLINCHER round is only shown when the host confirms there is a tie.
- Each question has a 10-second timer.
- When time runs out, the correct answer appears in a popup.
- The next question automatically continues after a short countdown.
- The host may also use the spacebar to move to the next question while the game screen is active.

### Notes For Hosts

- EASY and INTERMEDIATE rounds show multiple-choice options.
- HARD and CLINCHER questions show the question and answer only.
- At the end of all rounds, the system shows the `QUIZ COMPLETE` screen.

## Admin Page

Open the admin page to add questions into the quiz database.

### Admin Page Location

Use either of these paths:

- `/admin.html`
- `/admin.php`

If `admin.php` is used, it redirects to `admin.html`.

### How To Add A Question

1. Open the admin page.
2. Select the level:
	- ELEMENTARY
	- JUNIOR HIGH
	- SENIOR HIGH
3. Select the round:
	- EASY
	- INTERMEDIATE
	- HARD
	- CLINCHER
4. Enter the question.
5. If the round is EASY or INTERMEDIATE, fill in all four choices:
	- Choice A
	- Choice B
	- Choice C
	- Choice D
6. Enter the correct answer.
7. Click `ADD QUESTION`.

### Admin Page Behavior

- The choices section appears only for EASY and INTERMEDIATE rounds.
- For HARD and CLINCHER rounds, only the question and correct answer are needed.
- After saving, the page shows a success message if the question was added successfully.
- If something goes wrong, the page shows an error message.

## Recommended Use

- Use the main page during the live event.
- Use the admin page before the event to prepare questions.
- If needed, the admin page can also be used during the event to add or update questions.
