// MongoDB initialization script
db = db.getSiblingDB('gastrobot');

// Create a user for the application
db.createUser({
  user: 'gastrobot_user',
  pwd: 'gastrobot_password',
  roles: [
    {
      role: 'readWrite',
      db: 'gastrobot'
    }
  ]
});

// Create collections
db.createCollection('users');
db.createCollection('recipes');
db.createCollection('mealplans');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "verificationToken": 1 });
db.recipes.createIndex({ "name": 1 });
db.mealplans.createIndex({ "userId": 1, "date": 1 });

print('MongoDB initialization completed successfully!'); 