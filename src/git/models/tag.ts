import { configuration, DateStyle, TagSorting } from '../../configuration';
import { formatDate, fromNow } from '../../system/date';
import { memoize } from '../../system/decorators/memoize';
import { sortCompare } from '../../system/string';
import { GitReference, GitTagReference } from '../models';

export const TagDateFormatting = {
	dateFormat: undefined! as string | null,
	dateStyle: undefined! as DateStyle,

	reset: () => {
		TagDateFormatting.dateFormat = configuration.get('defaultDateFormat');
		TagDateFormatting.dateStyle = configuration.get('defaultDateStyle');
	},
};

export interface TagSortOptions {
	current?: boolean;
	orderBy?: TagSorting;
}

export class GitTag implements GitTagReference {
	static is(tag: any): tag is GitTag {
		return tag instanceof GitTag;
	}

	static isOfRefType(tag: GitReference | undefined) {
		return tag?.refType === 'tag';
	}

	static sort(tags: GitTag[], options?: TagSortOptions) {
		options = { orderBy: configuration.get('sortTagsBy'), ...options };

		switch (options.orderBy) {
			case TagSorting.DateAsc:
				return tags.sort((a, b) => a.date.getTime() - b.date.getTime());
			case TagSorting.NameAsc:
				return tags.sort((a, b) => sortCompare(a.name, b.name));
			case TagSorting.NameDesc:
				return tags.sort((a, b) => sortCompare(b.name, a.name));
			case TagSorting.DateDesc:
			default:
				return tags.sort((a, b) => b.date.getTime() - a.date.getTime());
		}
	}

	readonly refType = 'tag';

	constructor(
		public readonly repoPath: string,
		public readonly name: string,
		public readonly sha: string,
		public readonly message: string,
		public readonly date: Date,
		public readonly commitDate: Date | undefined,
	) {}

	get formattedDate(): string {
		return TagDateFormatting.dateStyle === DateStyle.Absolute
			? this.formatDate(TagDateFormatting.dateFormat)
			: this.formatDateFromNow();
	}

	get ref() {
		return this.name;
	}

	@memoize<GitTag['formatCommitDate']>(format => (format == null ? 'MMMM Do, YYYY h:mma' : format))
	formatCommitDate(format?: string | null) {
		return this.commitDate != null ? formatDate(this.commitDate, format ?? 'MMMM Do, YYYY h:mma') : '';
	}

	formatCommitDateFromNow() {
		return this.commitDate != null ? fromNow(this.commitDate) : '';
	}

	@memoize<GitTag['formatDate']>(format => (format == null ? 'MMMM Do, YYYY h:mma' : format))
	formatDate(format?: string | null) {
		return formatDate(this.date, format ?? 'MMMM Do, YYYY h:mma');
	}

	formatDateFromNow() {
		return fromNow(this.date);
	}

	@memoize()
	getBasename(): string {
		const index = this.name.lastIndexOf('/');
		return index !== -1 ? this.name.substring(index + 1) : this.name;
	}
}
