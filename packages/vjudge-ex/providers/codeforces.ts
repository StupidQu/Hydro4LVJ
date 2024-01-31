import { Logger, STATUS } from 'hydrooj';

const logger = new Logger('vjudge-ex/codeforces');

export default class CodeforcesProvider {
    // 这只是一个简单的示例，他并不会真正提供到 CodeForces 的评测

    async fetchResult(rid: string, next, end) {
        await next({ message: 'Congratulations! You did it.' });
        await end({ status: STATUS.STATUS_ACCEPTED });
    }

    async sendJudge(code: string, id: string, next, end) {
        next({ status: STATUS.STATUS_JUDGING });
        const rid = '0';
        logger.info(`Task ${rid} fetching result.`);
        this.fetchResult(rid, next, end).then(() => {
            logger.info(`Task ${rid} completed.`);
        });
    }
}
