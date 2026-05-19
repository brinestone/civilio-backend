import { defineRelations } from "drizzle-orm";
import { forms, formVersions, formItems, formSubmissions, formVersionItems, submissionVersions, submissionResponses, datasets, datasetItems } from "./schema";

export const relations = defineRelations({
	formDefinitions: forms,
	formVersions,
	formItems,
	formSubmissions,
	formVersionItems,
	submissionVersions,
	submissionResponses,
	datasets,
	datasetItems,
}, r => ({
	datasets: {
		items: r.many.datasetItems({
			from: r.datasets.id,
			to: r.datasetItems.dataset
		}),
		parent: r.one.datasets({
			optional: true,
			from: r.datasets.parentId,
			to: r.datasets.id
		})
	},
	datasetItems: {
		parentDataset: r.one.datasets({
			from: r.datasetItems.dataset,
			to: r.datasets.id,
			optional: true,
		})
	},
	formDefinitions: {
		versions: r.many.formVersions({
			from: r.formDefinitions.slug,
			to: r.formVersions.form
		}),
		currentVersion: r.one.formVersions({
			from: r.formDefinitions.slug,
			to: r.formVersions.form,
			optional: true,
			where: {
				isCurrent: true
			},
		}),
	},
	formVersions: {
		formRef: r.one.formDefinitions({
			from: r.formVersions.form,
			to: r.formDefinitions.slug,
		}),
		parent: r.one.formVersions({
			from: r.formVersions.parentId,
			to: r.formVersions.id,
			optional: true,
		}),
		items: r.many.formItems({
			from: r.formVersions.id.through(r.formVersionItems.formVersion),
			to: r.formItems.id.through(r.formVersionItems.itemId),
		}),
		submissions: r.many.formSubmissions({
			from: r.formVersions.id,
			to: r.formSubmissions.formVersion
		})
	},
	formSubmissions: {
		versions: r.many.submissionVersions({
			from: [r.formSubmissions.formVersion, r.formSubmissions.index, r.formSubmissions.form],
			to: [r.submissionVersions.formVersion, r.submissionVersions.index, r.submissionVersions.form],
		}),
		currentVersion: r.one.submissionVersions({
			from: [r.formSubmissions.formVersion, r.formSubmissions.index, r.formSubmissions.form],
			to: [r.submissionVersions.formVersion, r.submissionVersions.index, r.submissionVersions.form],
			optional: true,
			where: {
				isCurrent: true
			}
		})
	},
	submissionVersions: {
		responses: r.many.submissionResponses({
			from: [r.submissionVersions.tag, r.submissionVersions.formVersion, r.submissionVersions.index, r.submissionVersions.form],
			to: [r.submissionResponses.submissionTag, r.submissionResponses.formVersion, r.submissionResponses.submissionIndex, r.submissionResponses.form]
		})
	},
	submissionResponses: {
		itemSchema: r.one.formVersionItems({
			from: [r.submissionResponses.formVersion, r.submissionResponses.itemId],
			to: [r.formVersionItems.formVersion, r.formVersionItems.id],
			optional: false
		})
	}
}));