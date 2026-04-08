import { daoSkillRegistry, DaoSkillRegistry } from '../skill-registry';

describe('DaoSkillRegistry', () => {
  let registry: DaoSkillRegistry;

  beforeEach(() => {
    registry = new DaoSkillRegistry();
  });

  test('should create instance', () => {
    expect(registry).toBeDefined();
  });

  test('should register skill', () => {
    const skill = {
      id: 'test-skill',
      name: 'Test Skill',
      version: '1.0.0',
      description: 'A test skill',
    };

    registry.register(skill);
    const registeredSkill = registry.get('test-skill');
    expect(registeredSkill).toBeDefined();
    expect(registeredSkill?.definition.id).toBe('test-skill');
    expect(registeredSkill?.state).toBe('latent');
  });

  test('should throw error when registering existing skill', () => {
    const skill = {
      id: 'test-skill',
      name: 'Test Skill',
      version: '1.0.0',
    };

    registry.register(skill);
    expect(() => registry.register(skill)).toThrow(/技能已注册/);
  });

  test('should unregister skill', () => {
    const skill = {
      id: 'test-skill',
      name: 'Test Skill',
      version: '1.0.0',
    };

    registry.register(skill);
    const unregistered = registry.unregister('test-skill');
    expect(unregistered).toBe(true);
    expect(registry.get('test-skill')).toBeUndefined();
  });

  test('should return false when unregistering non-existent skill', () => {
    const unregistered = registry.unregister('non-existent');
    expect(unregistered).toBe(false);
  });

  test('should get skill by id', () => {
    const skill = {
      id: 'test-skill',
      name: 'Test Skill',
      version: '1.0.0',
    };

    registry.register(skill);
    const retrieved = registry.get('test-skill');
    expect(retrieved).toBeDefined();
    expect(retrieved?.definition.id).toBe('test-skill');
  });

  test('should list all skills', () => {
    const skill1 = {
      id: 'skill1',
      name: 'Skill 1',
      version: '1.0.0',
    };

    const skill2 = {
      id: 'skill2',
      name: 'Skill 2',
      version: '1.0.0',
    };

    registry.register(skill1);
    registry.register(skill2);

    const skills = registry.listAll();
    expect(skills.length).toBe(2);
  });

  test('should list skills by state', () => {
    const skill1 = {
      id: 'skill1',
      name: 'Skill 1',
      version: '1.0.0',
    };

    const skill2 = {
      id: 'skill2',
      name: 'Skill 2',
      version: '1.0.0',
    };

    registry.register(skill1);
    registry.register(skill2);
    registry.updateState('skill1', 'active');

    const latentSkills = registry.listByState('latent');
    expect(latentSkills.length).toBe(1);
    expect(latentSkills[0]?.definition.id).toBe('skill2');

    const activeSkills = registry.listByState('active');
    expect(activeSkills.length).toBe(1);
    expect(activeSkills[0]?.definition.id).toBe('skill1');
  });

  test('should update skill state', () => {
    const skill = {
      id: 'test-skill',
      name: 'Test Skill',
      version: '1.0.0',
    };

    registry.register(skill);
    const updated = registry.updateState('test-skill', 'active');
    expect(updated).toBe(true);
    const skillInstance = registry.get('test-skill');
    expect(skillInstance?.state).toBe('active');
  });

  test('should return false when updating state of non-existent skill', () => {
    const updated = registry.updateState('non-existent', 'active');
    expect(updated).toBe(false);
  });

  test('should increment use count', () => {
    const skill = {
      id: 'test-skill',
      name: 'Test Skill',
      version: '1.0.0',
    };

    registry.register(skill);
    const timestamp = Date.now();
    const incremented = registry.incrementUseCount('test-skill', timestamp);
    expect(incremented).toBe(true);
    const skillInstance = registry.get('test-skill');
    expect(skillInstance?.useCount).toBe(1);
    expect(skillInstance?.lastUsedAt).toBe(timestamp);
  });

  test('should return false when incrementing use count of non-existent skill', () => {
    const incremented = registry.incrementUseCount('non-existent', Date.now());
    expect(incremented).toBe(false);
  });

  test('should set activated at timestamp', () => {
    const skill = {
      id: 'test-skill',
      name: 'Test Skill',
      version: '1.0.0',
    };

    registry.register(skill);
    const timestamp = Date.now();
    const set = registry.setActivatedAt('test-skill', timestamp);
    expect(set).toBe(true);
    const skillInstance = registry.get('test-skill');
    expect(skillInstance?.activatedAt).toBe(timestamp);
  });

  test('should return false when setting activated at timestamp of non-existent skill', () => {
    const set = registry.setActivatedAt('non-existent', Date.now());
    expect(set).toBe(false);
  });

  test('should check if skill exists', () => {
    const skill = {
      id: 'test-skill',
      name: 'Test Skill',
      version: '1.0.0',
    };

    registry.register(skill);
    expect(registry.has('test-skill')).toBe(true);
    expect(registry.has('non-existent')).toBe(false);
  });
});

describe('daoSkillRegistry singleton', () => {
  test('should be defined', () => {
    expect(daoSkillRegistry).toBeDefined();
  });

  test('should have consistent instance', () => {
    expect(daoSkillRegistry).toBeInstanceOf(DaoSkillRegistry);
  });
});
