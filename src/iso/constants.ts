export const enum FileFlags {
	Hidden = 1,
	Directory = 1 << 1,
	AssociatedFile = 1 << 2,
	EARContainsInfo = 1 << 3,
	EARContainsPerms = 1 << 4,
	FinalDirectoryRecordForFile = 1 << 5,
}

export const rockRidgeIdentifier = 'IEEE_P1282';
