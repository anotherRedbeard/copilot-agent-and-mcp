describe('Book Categories', () => {
  const username = `e2ecat${Math.floor(Math.random() * 10000)}`;
  const password = `e2epass${Math.floor(Math.random() * 10000)}`;

  before(() => {
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

  it('filters books by category and keeps favorites behavior working', () => {
    cy.get('[data-testid="category-filter"]').contains('label', 'Fantasy').click();
    cy.get('[data-testid="book-card"]').should('have.length.greaterThan', 0);
    cy.get('[data-testid="book-card"]').each(($card) => {
      cy.wrap($card).contains('Fantasy').should('exist');
    });

    cy.get('button').contains('Add to Favorites').first().click();
    cy.get('a#favorites-link').click();
    cy.get('h2').contains('My Favorite Books').should('exist');
    cy.get('li').should('have.length.greaterThan', 0);
  });

  it('combines search and category filtering and supports clearing filters', () => {
    cy.get('[data-testid="category-filter"]').contains('label', 'Fantasy').click();
    cy.get('input[id="book-search"]').type('hobbit');
    cy.get('[data-testid="book-card"]').should('have.length', 1);
    cy.get('[data-testid="book-card"]').first().contains(/hobbit/i).should('exist');

    cy.contains('button', 'Clear all filters').click();
    cy.get('input[id="book-search"]').should('have.value', '');
  });
});