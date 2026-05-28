describe('Book Reviews', () => {
  const username = `e2erev${Math.floor(Math.random() * 10000)}`;
  const password = `e2epass${Math.floor(Math.random() * 10000)}`;

  before(() => {
    // Register a fresh user for the review flow
    cy.visit('http://localhost:5173');
    cy.contains('Create Account').click();
    cy.get('input[name="username"]').type(username);
    cy.get('input[name="password"]').type(password);
    cy.get('button#register').click();
    cy.contains('Registration successful! You can now log in.').should('exist');
  });

  beforeEach(() => {
    cy.visit('http://localhost:5173');
    cy.contains('Login').click();
    cy.get('input[name="username"]').type(username);
    cy.get('input[name="password"]').type(password);
    cy.get('button#login').click();
    cy.contains('Books').click();
    cy.contains('h2', 'Books').should('exist');
  });

  it('shows the reviews section with an average rating and a submission form', () => {
    cy.contains('Reviews').should('exist');
    cy.contains(/No ratings yet|\d+ review/).should('exist');
    cy.contains('button', 'Submit Review').should('exist');
    cy.contains('label', 'Your rating').should('exist');
  });

  it('allows the logged-in user to submit a review and see it in the list', () => {
    const reviewText = `Cypress review ${Date.now()}`;
    cy.contains('label', 'Your rating')
      .parent()
      .within(() => {
        cy.get('button[role="radio"]').eq(3).click(); // 4-star rating
      });
    cy.get('textarea[id^="review-text-"]').type(reviewText);
    cy.contains('button', 'Submit Review').click();
    cy.contains(reviewText, { timeout: 10000 }).should('exist');
    cy.contains(/\d+ review/).should('exist');
  });

  it('validates that a rating and review text are required', () => {
    cy.contains('button', 'Submit Review').click();
    cy.contains(/rating between 1 and 5/i).should('exist');
  });
});
