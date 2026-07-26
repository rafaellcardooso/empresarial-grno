from __future__ import annotations

from dataclasses import dataclass


def normalize_cf(value: str) -> str:
    return " ".join(value.strip().upper().split())


@dataclass(frozen=True)
class DatacenterCfGroup:
    cf_value: str

    @property
    def label(self) -> str:
        return self.cf_value


DATACENTER_CF_GROUPS: tuple[DatacenterCfGroup, ...] = (
    DatacenterCfGroup(cf_value="OM/BLM /EVM/DTC/BS"),
    DatacenterCfGroup(cf_value="OM/MNS /BLM/DTC/BS"),
    DatacenterCfGroup(cf_value="OM/SLS /GC /DTC/BS"),
)

_DATACENTER_CF_VALUES: frozenset[str] = frozenset(
    normalize_cf(group.cf_value) for group in DATACENTER_CF_GROUPS
)


def matches_datacenter_cf(cf_executante: str) -> bool:
    normalized = normalize_cf(cf_executante)
    if not normalized:
        return False
    return normalized in _DATACENTER_CF_VALUES


def group_for_cf(cf_executante: str) -> DatacenterCfGroup | None:
    normalized = normalize_cf(cf_executante)
    for group in DATACENTER_CF_GROUPS:
        if normalized == normalize_cf(group.cf_value):
            return group
    return None
