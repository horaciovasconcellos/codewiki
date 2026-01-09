DROP USER IF EXISTS 'app_user'@'%';
CREATE USER 'app_user'@'%' IDENTIFIED BY 'apppass123';
GRANT ALL PRIVILEGES ON auditoria_db.* TO 'app_user'@'%';
GRANT CREATE ON *.* TO 'app_user'@'%';
FLUSH PRIVILEGES;
SELECT User, Host FROM mysql.user WHERE User = 'app_user';
