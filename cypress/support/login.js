Cypress.Commands.add('login',(username,password) => {
    cy.visit('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');
    cy.get('[name="username"]').type(username);
    cy.get('[name="password"]').type(password);
    cy.get('[type="submit"]').click();
});