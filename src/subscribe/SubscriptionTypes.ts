export enum SubscriptionEnum {
    PUSH = 'push',
    PULL = 'pull'
}

export type SubscriptionType = {
    type: SubscriptionEnum
    interval?: number // (ms)
}
