import { RedisClient } from "redis";

const SIX_HOURS = 6 * 60 * 60 * 1000;

export interface User {
  userId: string;
  username: string;
  isAdmin: string;
  isRoomOwner: string;
}

export function getUser(
  client: RedisClient,
  partyId: string,
  userId: string
): Promise<{ [key: string]: string }> {
  return new Promise((resolve, reject) => {
    client.hgetall(`${partyId}:user:${userId}`, (err, user) => {
      if (err) {
        reject(err);
      }
      resolve(user);
    });
  });
}

export function getUsersInParty(client: RedisClient, partyId: string): Promise<Array<string>> {
  return new Promise((resolve, reject) => {
    client.smembers(`${partyId}:users`, (err, userIds) => {
      if (err) {
        reject(err);
      }

      console.log("userIds of users in party: ", userIds);
      if (userIds.length > 0) {
        Promise.all(userIds.map((userId) => getUser(client, partyId, userId)))
          .then((users) => {
            return users.map((user) => JSON.stringify(user));
          })
          .then((userStrs) => resolve(userStrs))
          .catch((err) => reject(err));
      } else {
        resolve([]);
      }
    });
  });
}

export function addUser(client: RedisClient, partyId: string, userDetails: User): Promise<void> {
  const { userId, username, isAdmin, isRoomOwner } = userDetails;
  return new Promise((resolve, reject) => {
    client
      .multi()
      .sadd(`${partyId}:users`, userId)
      .hmset(
        `${partyId}:user:${userId}`,
        "userId",
        userId,
        "username",
        username,
        "isAdmin",
        isAdmin,
        "isRoomOwner",
        isRoomOwner
      )
      .exec((err) => {
        if (err) {
          reject(err);
        }
        resolve();
      });
  });
}

export function removeUser(client: RedisClient, partyId: string, userId: string): Promise<any> {
  return new Promise((resolve, reject) => {
    client
      .multi()
      .srem(`${partyId}:users`, userId)
      .del(`${partyId}:user:${userId}`)
      .exec((err, res) => {
        if (err) {
          reject(err);
        }
        resolve(res);
      });
  });
}
