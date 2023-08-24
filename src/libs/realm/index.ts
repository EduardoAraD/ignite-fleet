import { createRealmContext } from '@realm/react';

import { Coords } from './schemas/Coords';
import { Historic } from './schemas/Historic';

const realmAcessBehavior: Realm.OpenRealmBehaviorConfiguration = {
  type: Realm.OpenRealmBehaviorType.OpenImmediately
}

export const syncConfig: any = {
  flexible: true,
  newRealmFileBehavior: realmAcessBehavior,
  existingRealmFileBehavior: realmAcessBehavior,
}

export const {
  RealmProvider,
  useObject,
  useQuery,
  useRealm,
} = createRealmContext({
  schema: [Historic, Coords],
  schemaVersion: 1,
});
