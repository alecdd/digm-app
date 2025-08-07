import React from "react";
declare module 'react-native';

declare module 'react-native-gesture-handler' {
  import { ReactNode } from 'react';
  import { ViewStyle } from 'react-native';
  
  export interface GestureHandlerRootViewProps {
    style?: ViewStyle;
    children?: ReactNode;
  }
  
  export const GestureHandlerRootView: React.ComponentType<GestureHandlerRootViewProps>;
}