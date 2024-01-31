/* eslint-disable no-await-in-loop */
import {
    Context, JudgeHandler, Logger, RecordModel,
    STATUS, TaskModel,
} from 'hydrooj';
// @ts-ignore
import CodeforcesProvider from './providers/codeforces';

const types = ['codeforces'];
const logger = new Logger('vjudge-ex');

const providers = {
    codeforces: new CodeforcesProvider(),
};

// 这只是一个示例，并不提供真正到 Codeforces 的远程评测

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function apply(ctx: Context) {
    if (process.env.NODE_APP_INSTANCE !== '0') return;

    async function judge(task) {
        const rdoc = await RecordModel.get(task.domainId, task.rid);
        if (!rdoc) return;
        task = Object.assign(rdoc, task);
        const next = (payload) => JudgeHandler.next({ ...payload, rid: task.rid, domainId: task.domainId });
        const end = (payload) => JudgeHandler.end({ ...payload, rid: task.rid, domainId: task.domainId });
        await next({ status: STATUS.STATUS_FETCHED });
        try {
            const provider = providers[task.subType];
            if (!provider) throw new Error(`provider ${task.subType} not found`);
            await provider.sendJudge(task.code, task.target, next, end);
        } catch (e) {
            logger.error(e);
            await end({ status: STATUS.STATUS_SYSTEM_ERROR, message: e.message });
        }
    }
    TaskModel.consume({ type: 'remotejudge', subType: { $in: types } }, judge, false);
    logger.info('vjudge-ex loaded.');
}
