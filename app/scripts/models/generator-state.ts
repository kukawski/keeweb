import * as kdbxweb from 'kdbxweb';
import { Model } from 'util/model';
import { PasswordGenerator, PasswordGeneratorOptions } from 'util/generators/password-generator';
import { Position } from 'util/types';
import { DropdownState } from 'models/dropdown-state';

class GeneratorState extends Model {
    pos: Position = {};
    opt?: PasswordGeneratorOptions;
    selectedPreset?: PasswordGeneratorOptions;
    showToggleButton = false;
    showPresetEditor = false;
    copyResult = true;
    password = '';
    derivedPreset?: PasswordGeneratorOptions;

    hide(): void {
        DropdownState.reset();
    }

    show(pos: Position): void {
        this.batchSet(() => {
            this.reset();
            this.pos = pos;
        });
        DropdownState.set('generator');
    }

    showWithPassword(pos: Position, password: kdbxweb.ProtectedValue): void {
        this.batchSet(() => {
            this.reset();
            this.pos = pos;
            this.derivedPreset = PasswordGenerator.deriveOpts(password);
            this.opt = this.derivedPreset;
        });
        DropdownState.set('generator');
    }
}

const instance = new GeneratorState();

export { instance as GeneratorState };