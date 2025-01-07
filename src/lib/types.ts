import {z} from 'zod';
import {selectPlayerSchema} from './schema';

export type Player = z.infer<typeof selectPlayerSchema>;