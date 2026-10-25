'use client';

import { useState } from 'react';
import { Provider } from 'react-redux';
import { makeStore } from './store';
import type { AppStore } from './store';
import { ApiAuthBootstrap } from "./ApiAuthBootstrap";


export default function StoreProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [store] = useState<AppStore>(() => makeStore());

  return (
    <Provider store={store}>
      <ApiAuthBootstrap />
      {children}
    </Provider>
  );
}
