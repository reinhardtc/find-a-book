const { AuthenticationErro } = require('apollo-server-express');
const { User } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
	Query: {
		me: async (parent, args, context) => {
			if (context.user) {
				const userData = await User.findOne({ _id: context.user._id })
					.select('-__v -password')
					.populate('thoughts')
					.populate('friends');

				return userData;
			}

			throw new AuthenticationError('Not logged in');
		},
		Mutation: {
			addUser: async (parent, args) => {
				const user = await User.create(args);
				const token = signToken(user);

				return { token, user };
			},
			login: async (parent, { email, password }) => {
				const user = await User.findOne({ email });

				if (!user) {
					throw new AuthenticationError('Incorrect credentials');
				}

				const correctPw = await user.isCorrectPassword(password);

				if (!correctPw) {
					throw new AuthenticationError('Incorrect credentials');
				}

				const token = signToken(user);
				return { token, user };
			},
			saveBook: async (parent, args, context) => {
				//console.log(args);

				if (context.user) {
					const updatedUser = await User.findOneAndUpdate(
						{ _id: context.user._id },
						{ $addToSet: { savedBooks: args } },
						{ new: true, runValidators: true }
					);

					return updatedUser;
				}

				throw new AuthenticationError('You need to be logged in!');
			},

			removeBook: async (parent, { bookId }, context) => {
				if (context.user) {
					const updatedUser = await User.findOneAndUpdate(
						{ _id: context.user._id },
						{ $pull: { savedBooks: { bookId: bookId } } },
						{ new: true }
					);
					return updatedUser;
				}

				throw new AuthenticationError('You need to be logged in!');
			},
		},
	},
};

module.exports = resolvers;
