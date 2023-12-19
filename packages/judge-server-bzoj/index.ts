import { Context, Handler, param, ProblemModel, RecordModel, Types, ObjectId } from 'hydrooj';

class BZOJJudgeHandler extends Handler {
    @param('code', Types.String)
    @param('pid', Types.Int)
    async post(domainId: string, code: string, pid: number) {
        code = decodeURI(code);
        if (domainId !== 'system') {
            this.response.body = { success: false };
            return;
        }
        const pdoc = await ProblemModel.get(domainId, pid);
        if (!pdoc || !pdoc.pid.startsWith('BZOJ')) {
            this.response.body = { success: false };
            return;
        }
        code = `// ${ this.request.ip }@${ new Date().toString() }\n${ code }`;
        const rid = await RecordModel.add(domainId, pdoc.docId, 1, 'cc.cc14o2', code, true, { type: 'judge' });
        this.response.body = {
            success: true,
            rid,
        };
    }
}

class BZOJRecordHandler extends Handler {
    @param('rid', Types.ObjectId)
    async get(domainId: string, rid: ObjectId) {
        if (domainId !== 'system') {
            this.response.body = { success: false };
            return;
        }
        const rdoc = await RecordModel.get(domainId, rid);
        if (!rdoc) {
            this.response.body = { success: false };
            return;
        }
        this.response.body = {
            success: true,
            status: rdoc.status,
            score: rdoc.score,
            compilerTexts: rdoc.compilerTexts,
            time: rdoc.time,
            memory: rdoc.memory,
            testCases: rdoc.testCases,
        };
    }
}

export function apply(ctx: Context) {
    ctx.Route('bzoj-judge', '/bzoj/judge', BZOJJudgeHandler);
    ctx.Route('bzoj-fetch', '/bzoj/record', BZOJRecordHandler);
}
