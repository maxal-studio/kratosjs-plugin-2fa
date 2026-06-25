import { Migration } from '@mikro-orm/migrations';

/**
 * 2FA plugin migration — creates the table that stores per-user TOTP secrets.
 */
export class Migration20260101000000CreateUserTwoFactor extends Migration {
	async up(): Promise<void> {
		this.addSql(`
			create table if not exists \`user_two_factor\` (
				\`id\` int unsigned not null auto_increment primary key,
				\`user_id\` varchar(255) not null,
				\`secret\` varchar(255) not null,
				\`enabled\` tinyint(1) not null default 0,
				\`created_at\` datetime not null,
				unique key \`user_two_factor_user_id_unique\` (\`user_id\`)
			) default character set utf8mb4 engine = InnoDB;
		`);
	}

	async down(): Promise<void> {
		this.addSql('drop table if exists `user_two_factor`;');
	}
}
