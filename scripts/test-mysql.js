const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function testMySQLConnection() {
  console.log('🔍 Test de connexion MySQL pour MailFlow');
  console.log('=====================================');
  
  try {
    const config = {
      host: 'localhost',
      port: 3306,
      user: 'mailflow',
      password: 'mailflow',
      database: 'mailflow',
      charset: 'utf8mb4'
    };
    
    console.log('📋 Configuration:');
    console.log(`   Host: ${config.host}:${config.port}`);
    console.log(`   User: ${config.user}`);
    console.log(`   Database: ${config.database}`);
    console.log('');
    
    console.log('🔌 Test de connexion...');
    const connection = await mysql.createConnection(config);
    console.log('✅ Connexion MySQL réussie !');
    
    console.log('');
    console.log('📊 Vérification des tables...');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`✅ ${tables.length} tables trouvées:`);
    tables.forEach(table => {
      console.log(`   - ${Object.values(table)[0]}`);
    });
    
    console.log('');
    console.log('👥 Vérification des utilisateurs...');
    const [users] = await connection.execute('SELECT id, email, display_name, role, is_active FROM users');
    console.log(`✅ ${users.length} utilisateur(s) trouvé(s):`);
    users.forEach(user => {
      console.log(`   - ${user.display_name} (${user.email}) - ${user.role}`);
    });
    
    console.log('');
    console.log('🔐 Test de l\'authentification admin...');
    const [adminUser] = await connection.execute(
      'SELECT id, email, password, display_name, role FROM users WHERE email = ?',
      ['admin@admin.com']
    );
    
    if (adminUser.length > 0) {
      const admin = adminUser[0];
      const isPasswordValid = await bcrypt.compare('admin123', admin.password);
      
      if (isPasswordValid) {
        console.log('✅ Authentification admin réussie');
        console.log(`   - Email: ${admin.email}`);
        console.log(`   - Nom: ${admin.display_name}`);
        console.log(`   - Rôle: ${admin.role}`);
      } else {
        console.log('❌ Mot de passe admin incorrect');
      }
    } else {
      console.log('❌ Utilisateur admin introuvable');
    }
    
    await connection.end();
    
    console.log('');
    console.log('🎉 TOUS LES TESTS SONT RÉUSSIS !');
    console.log('');
    console.log('🔑 Connexion MySQL:');
    console.log('   Host: localhost:3306');
    console.log('   User: mailflow');
    console.log('   Password: mailflow');
    console.log('   Database: mailflow');
    console.log('');
    console.log('🔑 Connexion admin:');
    console.log('   Email: admin@admin.com');
    console.log('   Mot de passe: admin123');
    
  } catch (error) {
    console.error('');
    console.error('❌ ERREUR DE CONNEXION MYSQL');
    console.error('============================');
    console.error('Détails:', error.message);
    console.error('Code:', error.code);
    
    if (error.code === 'ER_ACCESS_DENIED_FOR_USER') {
      console.error('');
      console.error('🔧 SOLUTION:');
      console.error('   1. Créez l\'utilisateur: CREATE USER \'mailflow\'@\'localhost\' IDENTIFIED BY \'mailflow\';');
      console.error('   2. Accordez les permissions: GRANT ALL PRIVILEGES ON mailflow.* TO \'mailflow\'@\'localhost\';');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('');
      console.error('🔧 SOLUTION:');
      console.error('   1. Créez la base: CREATE DATABASE mailflow;');
      console.error('   2. Importez: mysql -u mailflow -p mailflow < database/mailflow_structure.sql');
    }
    
    process.exit(1);
  }
}

testMySQLConnection();