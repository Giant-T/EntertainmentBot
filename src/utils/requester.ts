import { Axios } from 'axios';
import Entertainment from '../models/entertainment';

export default abstract class Requester {
  protected readonly axios: Axios;

  protected constructor(axios: Axios) {
    this.axios = axios;
  }

  /**
   * Recherche selon une requête et retourne une liste de divertissements
   * @param query La requête de recherche
   */
  public abstract search(query: string): Promise<Entertainment[]>;
  /**
   * Va chercher le divertissement selon son id
   * @param id L'id du divertissement
   */
  public abstract getById(id: number): Promise<Entertainment>;
}
