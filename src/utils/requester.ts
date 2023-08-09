import { Axios } from 'axios';
import Entertainment from '../types/entertainment';

export default abstract class Requester {
  protected readonly axios: Axios;

  protected constructor(axios: Axios) {
    this.axios = axios;
  }

  public abstract search(query: string): Promise<Entertainment[]>;
  public abstract getById(id: number): Promise<Entertainment>;
}
