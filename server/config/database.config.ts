// server/config/database.config.ts

export const dbConfig = {
	url: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gsqt_db',
	options: {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		serverSelectionTimeoutMS: 5000,
		socketTimeoutMS: 45000,
		family: 4, // Use IPv4, skip trying IPv6
		autoIndex: true
	},
	collections: {
		chats: 'chats',
		projects: 'projects'
	}
};