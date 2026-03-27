describe('Teste Login', () => {
    it('login com credenciais válidas', () => {
        cy.login('Admin', 'admin123');
        cy.url().should('include', '/dashboard');
    });

    it('login com senha inválida', () => {
        cy.login('Admin', 'senhaErrada');
        cy.contains('Invalid credentials').should('be.visible');
    });

    it('login com usuário inválido', () => {
        cy.login('usuarioInexistente', 'admin123');
        cy.contains('Invalid credentials').should('be.visible');
    });

    it('login com campos vazios', () => {
        cy.login('', '');
        cy.contains('Required').should('be.visible');
    });
})