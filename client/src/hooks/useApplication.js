import { useContext } from 'react';
import { ApplicationContext } from '../context/ApplicationContextObj';

export const useApplication = () => useContext(ApplicationContext);
