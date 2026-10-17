/** Системная библиотека macOS, где живёт proc_pid_rusage. */
export const LIB_SYSTEM_PATH = '/usr/lib/libSystem.B.dylib'

export const PROC_PID_RUSAGE_SIGNATURE = 'int proc_pid_rusage(int pid, int flavor, void *buffer)'

/**
 * Раскладка struct rusage_info_v0 из <sys/resource.h>: 16 байт uuid, затем десять
 * полей uint64. phys_footprint - восьмое из них. Этой версии структуры хватает: след
 * в ней есть, а более поздние только дописывают поля в конец.
 */
export const RUSAGE_INFO_V0 = 0
export const RUSAGE_INFO_V0_SIZE = 96
export const PHYS_FOOTPRINT_OFFSET = 72
