import axios from 'axios';
import {
    JudgeHandler, RecordModel, sleep, STATUS, TaskModel, Logger, JudgeResultBody, RecordDoc, yaml, SystemModel,
} from 'hydrooj';

const logger = new Logger('BZOJ');
const judgingStatus = [STATUS.STATUS_FETCHED, STATUS.STATUS_COMPILING, STATUS.STATUS_JUDGING, STATUS.STATUS_WAITING];

async function judge(task) {
    const endpoint = 'https://zshfoj.com/';
    const agent = axios.create({
        headers: {
            Accept: 'application/json',
        },
        baseURL: endpoint,
    });
    const rdoc = await RecordModel.get(task.domainId, task.rid);
    const next = (payload: Partial<JudgeResultBody>) => JudgeHandler.next({
        ...payload,
        rid: task.rid,
        domainId: task.domainId,
        rdoc,
    });
    const end = (payload: Partial<JudgeResultBody>) => JudgeHandler.end({
        ...payload,
        rid: task.rid,
        domainId: task.domainId,
        rdoc,
    });
    logger.info(`Fetched record(rid=${ task.rid }), judging now.`);
    await next({ status: STATUS.STATUS_FETCHED });
    try {
        const { data } = await agent.post('/bzoj/judge', {
            pid: task.target,
            code: encodeURI(rdoc.code),
        });
        if (!data.success) {
            await end({ status: STATUS.STATUS_SYSTEM_ERROR });
            return;
        }
        const remoteId = data.rid;
        await next({
            status: STATUS.STATUS_JUDGING,
        })
        logger.info(`Submitted to endpoint, remoteId=${remoteId}.`);
        let tries = 0;
        while (tries < 100) {
            await sleep(1000);
            tries++;
            const remoteRdoc: RecordDoc & {
                success: boolean
            } = (await (agent.get(`/bzoj/record?rid=${ remoteId }`))).data;
            if (!remoteRdoc.success) {
                await end({ status: STATUS.STATUS_SYSTEM_ERROR });
                return;
            }
            if (judgingStatus.includes(remoteRdoc.status)) continue;
            await end({
                status: remoteRdoc.status,
                score: remoteRdoc.score,
                message: remoteRdoc.compilerTexts.join('\n'),
                time: remoteRdoc.time,
                memory: remoteRdoc.memory,
                cases: remoteRdoc.testCases,
            });
            logger.info('Judge finished.');
            return;
        }
        await end({
            status: STATUS.STATUS_SYSTEM_ERROR,
            message: 'Judge exceeded 100s',
        });
        logger.error('Judge timeout.');
    } catch (e) {
        await end({ status: STATUS.STATUS_SYSTEM_ERROR, message: e.message });
        logger.error(`Judge ended with error: ${ e.message }`);
    }
}

export async function apply() {
    await TaskModel.consume({ type: 'remotejudge', subType: 'bzoj' }, judge, false);
    const langs = yaml.load(SystemModel.get('hydrooj.langs')) as any;
    await SystemModel.set('hydrooj.langs', yaml.dump({
        ...langs,
        bzoj: {
            display: 'BZOJ',
        },
        'bzoj.0': {
            display: 'C++14 (O2)',
            highlight: 'cpp astyle-c',
            monaco: 'cpp',
            code_file: 'foo.cc',
            compile: '/usr/bin/g++ -Wall -std=c++14 -o foo foo.cc -lm -O2 -I/include',
        },
    }));
}
