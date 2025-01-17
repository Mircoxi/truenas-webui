import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { getTestScheduler } from 'app/core/testing/utils/get-test-scheduler.utils';
import { VdevType } from 'app/enums/v-dev-type.enum';
import { Pool } from 'app/interfaces/pool.interface';
import { AddVdevsStore } from 'app/pages/storage/modules/pool-manager/components/add-vdevs/store/add-vdevs-store.service';
import { DispersalStrategy } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/2-enclosure-wizard-step/enclosure-wizard-step.component';
import { PoolManagerValidationService } from 'app/pages/storage/modules/pool-manager/store/pool-manager-validation.service';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { selectSystemFeatures } from 'app/store/system-info/system-info.selectors';

describe('PoolManagerValidationService', () => {
  describe('required steps validation', () => {
    let spectator: SpectatorService<PoolManagerValidationService>;
    let testScheduler: TestScheduler;

    const mockName$ = of('');
    const mockTopology$ = of({
      [VdevType.Data]: { vdevs: [] },
      [VdevType.Log]: { vdevs: [] },
    });
    const mockEnclosureSettings$ = of({
      limitToSingleEnclosure: null,
      dispersalStrategy: DispersalStrategy.LimitToSingle,
    });
    const mockHasMultipleEnclosuresAfterFirstStep$ = of(true);

    const createService = createServiceFactory({
      service: PoolManagerValidationService,
      providers: [
        mockProvider(PoolManagerStore, {
          name$: mockName$,
          enclosureSettings$: mockEnclosureSettings$,
          topology$: mockTopology$,
          hasMultipleEnclosuresAfterFirstStep$: mockHasMultipleEnclosuresAfterFirstStep$,
        }),
        mockProvider(AddVdevsStore, {
          pool$: of(null),
        }),
        provideMockStore({
          selectors: [
            {
              selector: selectSystemFeatures,
              value: {
                enclosure: true,
              },
            },
          ],
        }),
      ],
    });

    beforeEach(() => {
      spectator = createService();
      testScheduler = getTestScheduler();
    });

    it('generates errors for required steps', () => {
      testScheduler.run(({ expectObservable }) => {
        expectObservable(spectator.service.getPoolCreationErrors()).toBe('a', {
          a: [
            {
              severity: 'error',
              step: 'general',
              text: 'Name not added',
            },
            {
              severity: 'error',
              step: 'enclosure',
              text: 'No Enclosure selected for a Limit Pool To A Single Enclosure.',
            },
            {
              severity: 'error',
              step: 'data',
              text: 'At least 1 data VDEV is required.',
            },
          ],
        });
      });
    });

    it('generates top level error for each step if exists', () => {
      testScheduler.run(({ expectObservable }) => {
        expectObservable(spectator.service.getTopLevelErrorsForEachStep()).toBe('a', {
          a: {
            cache: null,
            data: 'At least 1 data VDEV is required.',
            dedup: null,
            enclosure: 'No Enclosure selected for a Limit Pool To A Single Enclosure.',
            general: 'Name not added',
            log: null,
            metadata: null,
            review: null,
            spare: null,
          },
        });
      });
    });
  });

  describe('warnings generation', () => {
    let spectator: SpectatorService<PoolManagerValidationService>;
    let testScheduler: TestScheduler;

    const mockName$ = of('No error for name');
    const mockTopology$ = of({
      [VdevType.Data]: {
        hasCustomDiskSelection: false,
        layout: 'STRIPE',
        vdevs: [
          [
            {
              identifier: '{serial_lunid}8HG29G5H_5000cca2700430f8',
              name: 'sdc',
              subsystem: 'scsi',
              exported_zpool: 'new',
              duplicate_serial: ['duplicate_serial'],
              number: 2080,
              serial: '8HG29G5H',
              lunid: '5000cca2700430f8',
              enclosure: {
                number: 0,
                slot: 1,
              },
              devname: 'sdc',
            },
          ],
        ],
      },
      [VdevType.Log]: {
        hasCustomDiskSelection: false,
        layout: 'STRIPE',
        vdevs: [
          {
            identifier: '{serial_lunid}8HG5ZRMH_5000cca2700ae4d8',
            name: 'sdf',
            subsystem: 'scsi',
            number: 2128,
            serial: '8HG5ZRMH',
            lunid: '5000cca2700ae4d8',
            size: 12000138625024,
            description: '',
            enclosure: {
              number: 0,
              slot: 1,
            },
            devname: 'sdf',
          },
        ],
      },
    });
    const mockEnclosureSettings$ = of({
      limitToSingleEnclosure: null,
      dispersalStrategy: DispersalStrategy.None,
    });
    const mockHasMultipleEnclosuresAfterFirstStep$ = of(true);

    const createService = createServiceFactory({
      service: PoolManagerValidationService,
      providers: [
        mockProvider(PoolManagerStore, {
          name$: mockName$,
          enclosureSettings$: mockEnclosureSettings$,
          topology$: mockTopology$,
          hasMultipleEnclosuresAfterFirstStep$: mockHasMultipleEnclosuresAfterFirstStep$,
        }),
        mockProvider(AddVdevsStore, {
          pool$: of(null),
        }),
        provideMockStore({
          selectors: [
            {
              selector: selectSystemFeatures,
              value: {
                enclosure: true,
              },
            },
          ],
        }),
      ],
    });

    beforeEach(() => {
      spectator = createService();
      testScheduler = getTestScheduler();
    });

    it('generates warnings for steps', () => {
      testScheduler.run(({ expectObservable }) => {
        expectObservable(spectator.service.getPoolCreationErrors()).toBe('a', {
          a: [
            {
              severity: 'warning',
              step: 'log',
              text: 'A stripe log VDEV may result in data loss if it fails combined with a power outage.',
            },
            {
              severity: 'warning',
              step: 'review',
              text: 'Some of the selected disks have exported pools on them. Using those disks will make existing pools on them unable to be imported. You will lose any and all data in selected disks.',
            },
            {
              severity: 'warning',
              step: 'review',
              text: 'Warning: There are 1 disks available that have non-unique serial numbers. Non-unique serial numbers can be caused by a cabling issue and adding such disks to a pool can result in lost data.',
            },
            {
              severity: 'error-warning',
              step: 'data',
              text: 'A stripe data VDEV is highly discouraged and will result in data loss if it fails',
            },
          ],
        });
      });
    });

    it('generates top level warnings for each step if exists', () => {
      testScheduler.run(({ expectObservable }) => {
        expectObservable(spectator.service.getTopLevelWarningsForEachStep()).toBe('a', {
          a: {
            cache: null,
            data: 'A stripe data VDEV is highly discouraged and will result in data loss if it fails',
            dedup: null,
            enclosure: null,
            general: null,
            log: 'A stripe log VDEV may result in data loss if it fails combined with a power outage.',
            metadata: null,
            review: 'Some of the selected disks have exported pools on them. Using those disks will make existing pools on them unable to be imported. You will lose any and all data in selected disks.',
            spare: null,
          },
        });
      });
    });
  });

  describe('errors when adding vdevs to existing pool', () => {
    let spectator: SpectatorService<PoolManagerValidationService>;
    let testScheduler: TestScheduler;

    const mockName$ = of('No error for name');
    const mockTopology$ = of({
      [VdevType.Data]: {
        hasCustomDiskSelection: false,
        layout: 'STRIPE',
        vdevs: [
          [
            {
              identifier: '{serial_lunid}8HG29G5H_5000cca2700430f8',
              name: 'sdc',
              subsystem: 'scsi',
              exported_zpool: 'new',
              duplicate_serial: ['duplicate_serial'],
              number: 2080,
              serial: '8HG29G5H',
              lunid: '5000cca2700430f8',
              enclosure: {
                number: 0,
                slot: 1,
              },
              devname: 'sdc',
            },
          ],
        ],
      },
      [VdevType.Log]: {
        hasCustomDiskSelection: false,
        layout: 'STRIPE',
        vdevs: [
          {
            identifier: '{serial_lunid}8HG5ZRMH_5000cca2700ae4d8',
            name: 'sdf',
            subsystem: 'scsi',
            number: 2128,
            serial: '8HG5ZRMH',
            lunid: '5000cca2700ae4d8',
            size: 12000138625024,
            description: '',
            enclosure: {
              number: 0,
              slot: 1,
            },
            devname: 'sdf',
          },
        ],
      },
    });
    const mockEnclosureSettings$ = of({
      limitToSingleEnclosure: null,
      dispersalStrategy: DispersalStrategy.None,
    });
    const mockHasMultipleEnclosuresAfterFirstStep$ = of(true);

    const createService = createServiceFactory({
      service: PoolManagerValidationService,
      providers: [
        mockProvider(PoolManagerStore, {
          name$: mockName$,
          enclosureSettings$: mockEnclosureSettings$,
          topology$: mockTopology$,
          hasMultipleEnclosuresAfterFirstStep$: mockHasMultipleEnclosuresAfterFirstStep$,
        }),
        mockProvider(AddVdevsStore, {
          pool$: of({ topology: { data: [{ type: 'MIRROR' }] } } as Pool),
        }),
        provideMockStore({
          selectors: [
            {
              selector: selectSystemFeatures,
              value: {
                enclosure: true,
              },
            },
          ],
        }),
      ],
    });

    beforeEach(() => {
      spectator = createService();
      testScheduler = getTestScheduler();
    });

    it('throws error when wrong vdev layout is chosen', () => {
      testScheduler.run(({ expectObservable }) => {
        expectObservable(spectator.service.getPoolCreationErrors()).toBe('a', {
          a: [
            {
              severity: 'error',
              step: 'data',
              text: 'Mixing Vdev layout types is not allowed. This pool already has some MIRROR Data Vdevs. You can only add vdevs of MIRROR type.',
            },
          ],
        });
      });
    });
  });

  describe('errors when adding vdevs to existing pool and no vdevs are selected', () => {
    let spectator: SpectatorService<PoolManagerValidationService>;
    let testScheduler: TestScheduler;

    const mockName$ = of('No error for name');
    const mockTopology$ = of({
      [VdevType.Data]: {
        hasCustomDiskSelection: false,
        layout: 'STRIPE',
        vdevs: [],
      },
    });
    const mockEnclosureSettings$ = of({
      limitToSingleEnclosure: null,
      dispersalStrategy: DispersalStrategy.None,
    });
    const mockHasMultipleEnclosuresAfterFirstStep$ = of(true);

    const createService = createServiceFactory({
      service: PoolManagerValidationService,
      providers: [
        mockProvider(PoolManagerStore, {
          name$: mockName$,
          enclosureSettings$: mockEnclosureSettings$,
          topology$: mockTopology$,
          hasMultipleEnclosuresAfterFirstStep$: mockHasMultipleEnclosuresAfterFirstStep$,
        }),
        mockProvider(AddVdevsStore, {
          pool$: of({ topology: { data: [{ type: 'MIRROR' }] } } as Pool),
        }),
        provideMockStore({
          selectors: [
            {
              selector: selectSystemFeatures,
              value: {
                enclosure: true,
              },
            },
          ],
        }),
      ],
    });

    beforeEach(() => {
      spectator = createService();
      testScheduler = getTestScheduler();
    });

    it('throws error when no vdevs are selected', () => {
      testScheduler.run(({ expectObservable }) => {
        expectObservable(spectator.service.getPoolCreationErrors()).toBe('a', {
          a: [
            {
              severity: 'error',
              step: 'review',
              text: 'At least 1 vdev is required to make an update to the pool.',
            },
          ],
        });
      });
    });
  });
});
