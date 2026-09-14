import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { StateMapping } from '../helper/zustand';

type TypeStoreGlobalPersist = {
  name: string;
  accessToken: string | null;
};

const StoreGlobalPersist = create(
  persist(
    (): TypeStoreGlobalPersist => ({ 
      name: 'gnok',
      accessToken: null,
    }), 
    {
      name: 'storage',
    }
  ),
);

type TypeSetMethodStoreGlobalPersist = {
  setName: (name: string) => void;
  setAccessToken: (token: string | null) => void;
};

const SetMethodStoreGlobalPersist: TypeSetMethodStoreGlobalPersist = {
  setName: (name: string) => {
    StoreGlobalPersist.setState({ name: name });
  },
  setAccessToken: (token: string | null) => {
    StoreGlobalPersist.setState({ accessToken: token });
  },
};

export const UseStoreGlobalPersist = (
  stateList: string[],
  isShallow?: boolean,
): TypeStoreGlobalPersist => {
  return StateMapping(stateList, StoreGlobalPersist, isShallow) as TypeStoreGlobalPersist;
};

export const GetSetMethodStoreGlobalPersist = (): TypeSetMethodStoreGlobalPersist => {
  return SetMethodStoreGlobalPersist;
};

export const GetStateStoreGlobalPersist = (): TypeStoreGlobalPersist => {
  return StoreGlobalPersist.getState();
};
